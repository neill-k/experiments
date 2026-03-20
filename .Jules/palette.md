## 2024-03-20 - [Added loading feedback to AuthButtons]
**Learning:** Found that the AuthButtons component disables the button while signing in with GitHub, but there's no visual feedback to the user that a background process is happening (loading state). Adding a loading state spinner or changing the text (e.g. 'Signing in...') makes the interface more intuitive and prevents the user from wondering if the button click registered.
**Action:** Adding a loading feedback text to the submit button when an async operation is triggered.
