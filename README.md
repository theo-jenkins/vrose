# VRose Project Documentation

## 1. Task Management

### ✅ Completed Tasks
- ✅ Keyword admin portal
- ✅ Form validation with CSRF protection
- ✅ Access and refresh token implementation
- ✅ Logout API fix
- ✅ Auth bar moved to top navigation
- ✅ Theme switcher implementation
- ✅ Login auto-fill 400 error fix
- ✅ TopBar added to signup/login pages
- ✅ Redux state manager integration
- ✅ Tree hydration error fix
- ✅ CSRF token validation
- ✅ Custom font support (DN-Sans)
- ✅ Keyword removal from signup/models
- ✅ Dashboard feature permissions
- ✅ Dashboard features table & admin panel
- ✅ Signup form width restriction fix
- ✅ Horizontal navigation bar implementation
- ✅ Logout redirect and auth state fix
- ✅ Color scheme consistency
- ✅ Enhanced signup flow (email → continue/Google options → form)
- ✅ Dashboard configuration (flex grid, API-driven features, icons, permissions)
- ✅ Adjust logging for the pgadmin docker image

### 🚧 In Progress Tasks
- 🚧 Homepage visual improvements
- 🚧 VRose logo design
- 🚧 Welcome message enhancement
- 🚧 'Go to dashboard' button aesthetics
- 🚧 Expired token login handling
- 🚧 Google signup integration
- 🚧 Feature access control for insufficient permissions

### 📋 Pending Tasks
- Feature list page
- Pricing page implementation
- Support page creation
- Mobile responsive sizing
- Permission based access for features
- SVG theme-based coloring
- Legacy behavior error resolution
- Signup form validation (disable until complete) ???
- Edit file name during file upload
- Find incorrect SQL queries referring to legacy model names.
- Adjust logging for the pgadmin docker image
- Adjust sign up serializer to set permissions accordingly, not access_all
- Fix refresh token api endpoint not working correctly for google auth

## 2. Development Setup & Commands

### Initial Setup
**Git Configuration:**
- Install git and configure SSH
- Clone repository: `git clone git@github.com:theo-jenkins/vrose.git`

**Virtual Environment Setup:**
- Ubuntu: `python3 -m venv venv` → `source venv/bin/activate`
- Windows: `python -m venv venv` → `venv/Scripts/activate`

**Docker Configuration:**
- Initial build: `docker-compose up --build`
- Standard run: `docker-compose up`

**Development Mode (Hot Reloading):**
- Database only: `docker-compose start db`
- Backend: `python manage.py runserver`
- Frontend: `npm run dev` (from frontend directory)

**Git Workflow:**
- Stage changes: `git add .`
- Commit: `git commit -m "{message}"`
- Push: `git push origin main`

---

## 3. Project Roadmap & Progress

### ✅ Completed Stages

**Stage Zero: Project Setup** ![██████████] 100%
- Project scope and goals defined
- All dependencies installed
- Environment variables configured

**Stage One: User Authentication** ![██████████] 100%
- Signup, login, password reset flows
- User roles and privileges
- Django admin portal
- Google Sign-in integration

**Stage Two: User Experience** ![██████████] 100%
- Design style and UI framework implementation
- Theme switcher with light/dark mode

**Stage Three: Data Upload & Parsing** ![██████████] 100%
- Secure file uploads (CSV, Excel)
- Tabular data extraction
- User column selection
- Auto-mapping to DB schema
- Task manager integration
- Import progress tracking

### 🚧 Upcoming Stages

**Stage Four: Data Visualization** ![----------] 0%
- Interactive charts and tables
- Filters, sorting, summary statistics
- Responsive design with theme compatibility

**Stage Five: AI Agent Implementation** ![----------] 0%
- OpenAI GPT integration for recommendations
- Chatbot interface
- ML logic for personalized adjustments

**Stage Six: User Interface Refinement** ![----------] 0%
- Streamlined user flow optimization
- Consistent UI design
- Error handling and loading states

**Stage Seven: Landing Pages** ![----------] 0%
- Public-facing pages (About, Pricing, Support)
- SEO optimization
- Analytics tracking

**Stage Eight: Payment Integration** ![----------] 0% *(Optional)*
- Stripe payment gateway
- Billing management
- Secure payment flows

**Stage Nine: Deployment** ![----------] 0%
- Docker container finalization
- VPS setup with Nginx
- SSL, domain, and monitoring configuration

---