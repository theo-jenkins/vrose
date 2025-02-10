To do:
- Add a key word admin portal :white_check_mark:
- Add form validation with CSRF protection :white_check_mark:
- Implement access and refresh token issuance :white_check_mark:
- Fix the '/' page to look better :construction:
- Fix the logout api :white_check_mark:
- Move auth bar to nav bar to top bar (idfk anymore) :white_check_mark:
- Add a vrose logo :construction:
- Add a welcome message :construction:
- Add a theme switcher :white_check_mark:
- Configure a color scheme on all components :construction:
- Change nav bar to top horizontal bar (Logo, Features, Pricing, Support, Theme Switcher, Login, Sign Up) :white_check_mark:
- Add a feature list
- Add a pricing page
- Add a support page
- Implement feature bar as a something else
- Fix login as auto filling the fields but returning 400 error detecting empty form fields :white_check_mark:
- Add TopBar to signup and login pages. :white_check_mark:
- Add redux state manager to save user auth and preferences :white_check_mark:
- Change imports to relative imports
- Fix tree hydration error :white_check_mark:
- Add check for CSRF token before fetching it :white_check_mark:
- Add custom font support (DN-Sans) :white_check_mark:
- Adjust the sign up flow:
    1. User selects sign up :white_check_mark:
    2. User enters email :white_check_mark:
    3. Page shows 'continue' or 'sign up with google' button :construction:
    4. Continue button should render a form with email, password, confirm password, and sign up button :white_check_mark:
    5. Sign up button should be disabled until all fields are filled
    6. Implement google sign up
- Remove keyword from sign up and models
- Add sign in with google to log in page
- Add a typewriter effect to welcome message
- Configure dashboard page:
    1. Flex grid showing 3-4 main features :white_check_mark:
    2. Clicking on a feature should redirect to that page :construction:
- Fix logout redirecting to sign in page and not deleting auth state :white_check_mark:

Design Choices:
- Buttons should be outlined and rounded by default
- Buttons should expand on hover
- Links should highlight on hover
- Links should bolded on hover?
- Dashboard link should have chevron