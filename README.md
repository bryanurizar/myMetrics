# myMetrics Application

A study application that allows user to create boards with tasks and then create a study session with a selection of those tasks using a countdown timer. The application also has an analytics page with various charts

### Technologies Used

- Frontend: Vanilla JavasScript with EJS Templating and CSS
- Backend: ExpressJS and NodeJS
- Database: Postgres with no ORM (i.e. raw SQL queries)
- Authentication: Google OAuth 2.0 using PassportJS

### Interesting Challenges/Learning Experiences

- Implmentation of the Drag and Drop API and persistence of dragged items to the database
- Creating a user actions log table in the database to collect data for the analytics
- Learned of OAuth / OpenID Connect
- Postgres and learned to write SQL queries / prevent SQL injection attacks
