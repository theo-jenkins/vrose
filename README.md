To do:
- Add a key word admin portal :white_check_mark:
- Add form validation with CSRF protection :white_check_mark:
- Implement access and refresh token issuance :white_check_mark:
- Fix the logout api :white_check_mark:
- Move auth bar to nav bar to top bar (idfk anymore) :white_check_mark:
- Add a theme switcher :white_check_mark:
- Fix login as auto filling the fields but returning 400 error detecting empty form fields :white_check_mark:
- Add TopBar to signup and login pages. :white_check_mark:
- Add redux state manager to save user auth and preferences :white_check_mark:
- Fix tree hydration error :white_check_mark:
- Add check for CSRF token before fetching it :white_check_mark:
- Add custom font support (DN-Sans) :white_check_mark:
- Remove keyword from sign up and models :white_check_mark:
- Set permissions for dashboard features :white_check_mark:
- Add dashboard features table :white_check_mark:
- Add dashboard features to admin panel :white_check_mark:
- Fix form 2 in signup being restricted width ways :white_check_mark:
- Change nav bar to top horizontal bar (Logo, Features, Pricing, Support, Theme Switcher, Login, Sign Up) :white_check_mark:
- Fix logout redirecting to sign in page and not deleting auth state :white_check_mark:
- Configure a color scheme on all components :white_check_mark:
- Fix the '/' page to look better :construction:
- Add a vrose logo :construction:
- Add a welcome message :construction:
- Improve 'go to dashboard' button aesthetics :contsctruction:
- Fix login for different users when tokens are expired. :construction:
- Add a feature list
- Add a pricing page
- Add a support page
- Change imports to relative imports
- Add a typewriter effect to welcome message
- Adjust sizing for mobile
- Set permissions based on product selection
- Set .svg files to be colored based on system theme
- Adjust the sign up flow:
    1. User selects sign up :white_check_mark:
    2. User enters email :white_check_mark:
    3. Page shows 'continue' or 'sign up with google' button :construction:
    4. Continue button should render a form with email, password, confirm password, and sign up button :white_check_mark:
    5. Sign up button should be disabled until all fields are filled
    6. Implement google sign up
- Configure dashboard page:
    1. Flex grid showing 3-4 main features :white_check_mark:
    2. Clicking on a feature should redirect to that page :white_check_mark:
    3. Features should be fetched from the API :white_check_mark:
    4. Feature icons should be displayed next to the features title :white_check_mark:
    5. Users permissions should be cross checked with the features :white_check_mark:
    6. Disable features for users with insufficient permissions :construction:
    
Design Choices:
- Buttons should be outlined and rounded by default
- Buttons should expand on hover
- Links should highlight on hover
- Links should bolded on hover?
- Dashboard link should have chevron