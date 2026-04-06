grep -rn '<button' src/components/ | awk -F: '{print $1}' | sort | uniq | while read file; do
    echo "--- $file ---"
    grep -n -B 2 -A 5 '<button' "$file" | grep -i "disabled="
done
