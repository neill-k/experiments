'use client'

import { useEffect, useRef, useState } from 'react'

// Types
interface Vector {
  x: number
  y: number
}

interface PhysicsObject {
  id: number
  type: 'ball' | 'box' | 'confetti'
  pos: Vector
  vel: Vector
  acc: Vector
  size: number
  rotation: number
  angularVel: number
  color: string
  trail: Vector[]
  lifetime: number
  bounced: boolean
}

interface Explosion {
  pos: Vector
  particles: { pos: Vector; vel: Vector; life: number; color: string }[]
}

// p5.js will be loaded dynamically
let p5: any = null

export default function P5Wrapper() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const initP5 = async () => {
      const p5Module = await import('p5')
      p5 = p5Module.default

      const sketch = (p: any) => {
        // Constants
        const COLORS = {
          cyan: '#00ffff',
          pink: '#ff00ff',
          green: '#00ff00',
          white: '#ffffff'
        }
        
        // State
        let objects: PhysicsObject[] = []
        let explosions: Explosion[] = []
        let nextId = 0
        let gravity = 0.3
        let wind = 0
        let chaosMode = false
        let screenShake = { x: 0, y: 0, intensity: 0 }
        let showTrails = true
        let objectType: 'ball' | 'box' | 'confetti' = 'ball'
        let gravitySlider: any
        let windSlider: any
        let chaosButton: any
        let clearButton: any
        let typeButtons: any[] = []
        let trailToggle: any

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
          canvas.parent(containerRef.current)
          
          // Controls
          const controlsY = p.height - 120
          
          // Gravity slider
          gravitySlider = p.createSlider(0, 1, 0.3, 0.01)
          gravitySlider.position(20, controlsY)
          gravitySlider.style('width', '100px')
          gravitySlider.style('accent-color', COLORS.cyan)
          
          // Wind slider
          windSlider = p.createSlider(-0.5, 0.5, 0, 0.01)
          windSlider.position(140, controlsY)
          windSlider.style('width', '100px')
          windSlider.style('accent-color', COLORS.pink)
          
          // Type buttons
          const types: ('ball' | 'box' | 'confetti')[] = ['ball', 'box', 'confetti']
          types.forEach((type, i) => {
            const btn = p.createButton(type.toUpperCase())
            btn.position(20 + i * 80, controlsY + 40)
            btn.style('background', 'transparent')
            btn.style('border', `1px solid ${type === objectType ? COLORS.green : '#333'}`)
            btn.style('color', type === objectType ? COLORS.green : '#666')
            btn.style('padding', '4px 12px')
            btn.style('font-family', 'monospace')
            btn.style('cursor', 'pointer')
            btn.mousePressed(() => {
              objectType = type
              typeButtons.forEach((b, j) => {
                b.style('border', `1px solid ${types[j] === type ? COLORS.green : '#333'}`)
                b.style('color', types[j] === type ? COLORS.green : '#666')
              })
            })
            typeButtons.push(btn)
          })
          
          // Chaos mode button
          chaosButton = p.createButton('CHAOS MODE')
          chaosButton.position(280, controlsY)
          chaosButton.style('background', 'transparent')
          chaosButton.style('border', `1px solid ${COLORS.pink}`)
          chaosButton.style('color', COLORS.pink)
          chaosButton.style('padding', '4px 12px')
          chaosButton.style('font-family', 'monospace')
          chaosButton.style('cursor', 'pointer')
          chaosButton.mousePressed(() => {
            chaosMode = !chaosMode
            chaosButton.style('background', chaosMode ? COLORS.pink : 'transparent')
            chaosButton.style('color', chaosMode ? '#000' : COLORS.pink)
          })
          
          // Clear button
          clearButton = p.createButton('CLEAR')
          clearButton.position(400, controlsY)
          clearButton.style('background', 'transparent')
          clearButton.style('border', '1px solid #666')
          clearButton.style('color', '#666')
          clearButton.style('padding', '4px 12px')
          clearButton.style('font-family', 'monospace')
          clearButton.style('cursor', 'pointer')
          clearButton.mousePressed(() => {
            objects = []
          })
          
          // Trail toggle
          trailToggle = p.createButton('TRAILS: ON')
          trailToggle.position(480, controlsY)
          trailToggle.style('background', 'transparent')
          trailToggle.style('border', `1px solid ${COLORS.cyan}`)
          trailToggle.style('color', COLORS.cyan)
          trailToggle.style('padding', '4px 12px')
          trailToggle.style('font-family', 'monospace')
          trailToggle.style('cursor', 'pointer')
          trailToggle.mousePressed(() => {
            showTrails = !showTrails
            trailToggle.style('color', showTrails ? COLORS.cyan : '#666')
            trailToggle.style('border-color', showTrails ? COLORS.cyan : '#666')
            trailToggle.html(`TRAILS: ${showTrails ? 'ON' : 'OFF'}`)
          })
        }

        p.draw = () => {
          p.background(0)
          
          // Update screen shake
          if (screenShake.intensity > 0) {
            screenShake.x = p.random(-screenShake.intensity, screenShake.intensity)
            screenShake.y = p.random(-screenShake.intensity, screenShake.intensity)
            screenShake.intensity *= 0.9
            if (screenShake.intensity < 0.5) screenShake.intensity = 0
          }
          p.translate(screenShake.x, screenShake.y)
          
          // Update values from sliders
          gravity = gravitySlider.value()
          wind = windSlider.value()
          
          // Chaos mode random forces
          if (chaosMode && p.frameCount % 10 === 0) {
            // Random explosion
            if (Math.random() < 0.3) {
              createExplosion(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(100, p.height * 0.5)
              )
            }
            // Random wind gusts
            wind = p.random(-0.5, 0.5)
            // Random gravity changes
            gravity = p.random(0.1, 0.8)
          }
          
          // Spawn on mouse drag / touch
          if (p.mouseIsPressed && p.mouseY < p.height - 130) {
            if (p.frameCount % 3 === 0) {
              spawnObject(p.mouseX, p.mouseY)
            }
          }
          
          // Update and draw objects
          updateObjects()
          drawObjects()
          
          // Update and draw explosions
          updateExplosions()
          drawExplosions()
          
          // Draw UI labels
          drawUILabels()
          
          // Remove dead objects
          objects = objects.filter(o => o.lifetime > 0 && o.pos.y < p.height + 100)
        }

        function spawnObject(x: number, y: number) {
          const colorChoice = [COLORS.cyan, COLORS.pink, COLORS.green][Math.floor(Math.random() * 3)]
          
          if (objectType === 'confetti') {
            for (let i = 0; i < 3; i++) {
              objects.push({
                id: nextId++,
                type: 'confetti',
                pos: { x: x + p.random(-10, 10), y: y + p.random(-10, 10) },
                vel: { x: p.random(-3, 3), y: p.random(-2, 2) },
                acc: { x: 0, y: 0 },
                size: p.random(4, 10),
                rotation: p.random(p.TWO_PI),
                angularVel: p.random(-0.2, 0.2),
                color: colorChoice,
                trail: [],
                lifetime: 300 + p.random(200),
                bounced: false
              })
            }
          } else {
            objects.push({
              id: nextId++,
              type: objectType,
              pos: { x, y },
              vel: { x: p.random(-2, 2), y: 0 },
              acc: { x: 0, y: 0 },
              size: objectType === 'ball' ? p.random(15, 35) : p.random(20, 45),
              rotation: p.random(p.TWO_PI),
              angularVel: p.random(-0.1, 0.1),
              color: colorChoice,
              trail: [],
              lifetime: 2000,
              bounced: false
            })
          }
        }

        function createExplosion(x: number, y: number) {
          const explosion: Explosion = {
            pos: { x, y },
            particles: []
          }
          
          const colorChoice = [COLORS.cyan, COLORS.pink, COLORS.green][Math.floor(Math.random() * 3)]
          
          for (let i = 0; i < 20; i++) {
            explosion.particles.push({
              pos: { x, y },
              vel: { x: p.random(-8, 8), y: p.random(-10, 2) },
              life: 60 + p.random(40),
              color: colorChoice
            })
          }
          
          explosions.push(explosion)
          screenShake.intensity = 15
          
          // Spawn debris
          for (let i = 0; i < 5; i++) {
            const debrisType = Math.random() < 0.5 ? 'ball' : 'box'
            objects.push({
              id: nextId++,
              type: debrisType,
              pos: { x, y },
              vel: { x: p.random(-6, 6), y: p.random(-8, -2) },
              acc: { x: 0, y: 0 },
              size: p.random(10, 25),
              rotation: p.random(p.TWO_PI),
              angularVel: p.random(-0.3, 0.3),
              color: colorChoice,
              trail: [],
              lifetime: 400,
              bounced: false
            })
          }
        }

        function updateObjects() {
          objects.forEach(obj => {
            // Apply gravity
            if (obj.type === 'confetti') {
              obj.acc.y += gravity * 0.3 // Lighter gravity for confetti
            } else {
              obj.acc.y += gravity
            }
            
            // Apply wind
            if (obj.type === 'confetti') {
              obj.acc.x += wind * 2 // More wind effect on confetti
            } else {
              obj.acc.x += wind
            }
            
            // Chaos mode: random forces
            if (chaosMode) {
              obj.acc.x += p.random(-0.5, 0.5)
              obj.acc.y += p.random(-0.3, 0.3)
            }
            
            // Update velocity
            obj.vel.x += obj.acc.x
            obj.vel.y += obj.acc.y
            
            // Air resistance
            obj.vel.x *= 0.99
            obj.vel.y *= 0.995
            
            // Update position
            obj.pos.x += obj.vel.x
            obj.pos.y += obj.vel.y
            
            // Update rotation
            obj.rotation += obj.angularVel
            if (obj.type === 'confetti') {
              obj.angularVel *= 0.98
            }
            
            // Reset acceleration
            obj.acc = { x: 0, y: 0 }
            
            // Trail
            if (showTrails && p.frameCount % 2 === 0 && obj.trail.length < 20) {
              obj.trail.push({ x: obj.pos.x, y: obj.pos.y })
            }
            if (obj.trail.length > 20) {
              obj.trail.shift()
            }
            
            // Lifetime
            obj.lifetime--
            
            // Boundary collisions
            const floorY = p.height - 130
            const bounce = obj.type === 'ball' ? 0.7 : obj.type === 'box' ? 0.4 : 0.2
            
            // Floor
            if (obj.pos.y + obj.size > floorY) {
              obj.pos.y = floorY - obj.size
              obj.vel.y *= -bounce
              obj.angularVel += obj.vel.x * 0.05
              obj.bounced = true
              
              // Screen shake on hard bounce
              if (Math.abs(obj.vel.y) > 5) {
                screenShake.intensity = Math.min(screenShake.intensity + 3, 12)
              }
            }
            
            // Walls
            if (obj.pos.x - obj.size < 0) {
              obj.pos.x = obj.size
              obj.vel.x *= -bounce
            }
            if (obj.pos.x + obj.size > p.width) {
              obj.pos.x = p.width - obj.size
              obj.vel.x *= -bounce
            }
            
            // Ceiling
            if (obj.pos.y - obj.size < 0) {
              obj.pos.y = obj.size
              obj.vel.y *= -bounce
            }
          })
          
          // Object-object collisions (simplified)
          for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
              const a = objects[i]
              const b = objects[j]
              
              const dx = b.pos.x - a.pos.x
              const dy = b.pos.y - a.pos.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const minDist = (a.size + b.size) * 0.6
              
              if (dist < minDist && dist > 0) {
                // Separate
                const overlap = minDist - dist
                const nx = dx / dist
                const ny = dy / dist
                
                const moveX = nx * overlap * 0.5
                const moveY = ny * overlap * 0.5
                
                a.pos.x -= moveX
                a.pos.y -= moveY
                b.pos.x += moveX
                b.pos.y += moveY
                
                // Exchange velocities (simplified elastic)
                const dvx = b.vel.x - a.vel.x
                const dvy = b.vel.y - a.vel.y
                const dot = dvx * nx + dvy * ny
                
                if (dot < 0) {
                  const impulse = dot * 0.5
                  a.vel.x += impulse * nx
                  a.vel.y += impulse * ny
                  b.vel.x -= impulse * nx
                  b.vel.y -= impulse * ny
                  
                  // Add spin
                  a.angularVel += p.random(-0.05, 0.05)
                  b.angularVel += p.random(-0.05, 0.05)
                }
              }
            }
          }
        }

        function drawObjects() {
          // Draw trails first
          if (showTrails) {
            objects.forEach(obj => {
              if (obj.trail.length > 1) {
                p.noFill()
                p.stroke(obj.color)
                p.strokeWeight(2)
                p.beginShape()
                obj.trail.forEach((t, i) => {
                  const alpha = p.map(i, 0, obj.trail.length, 0, 100)
                  p.stroke(p.red(p.color(obj.color)), p.green(p.color(obj.color)), p.blue(p.color(obj.color)), alpha)
                  p.vertex(t.x, t.y)
                })
                p.endShape()
              }
            })
          }
          
          // Draw objects
          objects.forEach(obj => {
            p.push()
            p.translate(obj.pos.x, obj.pos.y)
            p.rotate(obj.rotation)
            
            // Glow effect
            p.drawingContext.shadowBlur = 15
            p.drawingContext.shadowColor = obj.color
            
            p.fill(obj.color)
            p.noStroke()
            
            if (obj.type === 'ball') {
              p.ellipse(0, 0, obj.size * 2, obj.size * 2)
            } else if (obj.type === 'box') {
              p.rectMode(p.CENTER)
              p.rect(0, 0, obj.size * 2, obj.size * 2)
            } else if (obj.type === 'confetti') {
              p.rectMode(p.CENTER)
              p.rect(0, 0, obj.size, obj.size * 0.4)
            }
            
            p.drawingContext.shadowBlur = 0
            p.pop()
          })
        }

        function updateExplosions() {
          explosions.forEach(exp => {
            exp.particles.forEach(particle => {
              particle.pos.x += particle.vel.x
              particle.pos.y += particle.vel.y
              particle.vel.y += 0.2
              particle.vel.x *= 0.98
              particle.life--
            })
          })
          explosions = explosions.filter(exp => 
            exp.particles.some(p => p.life > 0)
          )
        }

        function drawExplosions() {
          explosions.forEach(exp => {
            exp.particles.forEach(particle => {
              if (particle.life > 0) {
                const alpha = p.map(particle.life, 0, 100, 0, 255)
                p.fill(p.red(p.color(particle.color)), p.green(p.color(particle.color)), p.blue(p.color(particle.color)), alpha)
                p.noStroke()
                p.ellipse(particle.pos.x, particle.pos.y, 4, 4)
              }
            })
          })
        }

        function drawUILabels() {
          p.fill(COLORS.white)
          p.noStroke()
          p.textFont('monospace')
          p.textSize(12)
          
          // Labels for sliders
          p.fill(COLORS.cyan)
          p.text(`GRAVITY: ${gravity.toFixed(2)}`, 20, p.height - 140)
          
          p.fill(COLORS.pink)
          p.text(`WIND: ${wind.toFixed(2)}`, 140, p.height - 140)
          
          // Object count
          p.fill(COLORS.green)
          p.text(`OBJECTS: ${objects.length}`, 260, p.height - 140)
          
          // Controls hint
          p.fill(255, 255, 255, 100)
          p.textSize(10)
          p.text('CLICK & DRAG TO SPAWN', p.width - 180, p.height - 140)
          p.text('DOUBLE-CLICK FOR EXPLOSION', p.width - 220, p.height - 125)
        }

        p.doubleClick = () => {
          if (p.mouseY < p.height - 130) {
            createExplosion(p.mouseX, p.mouseY)
          }
        }

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight)
          // Reposition controls
          const controlsY = p.height - 120
          gravitySlider.position(20, controlsY)
          windSlider.position(140, controlsY)
          typeButtons[0].position(20, controlsY + 40)
          typeButtons[1].position(100, controlsY + 40)
          typeButtons[2].position(180, controlsY + 40)
          chaosButton.position(280, controlsY)
          clearButton.position(400, controlsY)
          trailToggle.position(480, controlsY)
        }

        // Touch support
        p.touchStarted = () => {
          if (p.mouseY < p.height - 130) {
            spawnObject(p.mouseX, p.mouseY)
          }
          return false // Allow default behavior
        }

        p.touchMoved = () => {
          if (p.mouseY < p.height - 130 && p.frameCount % 3 === 0) {
            spawnObject(p.mouseX, p.mouseY)
          }
          return false
        }
      }

      new p5(sketch)
    }

    initP5()

    return () => {
      // Cleanup p5 instance
      if (p5 && p5.instance) {
        p5.instance.remove()
      }
    }
  }, [])

  return <div ref={containerRef} className="w-full h-screen" />
}
