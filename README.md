# polyclinicSystem
This project aims to develop a web application designed to address several operational challenges faced by polyclinics in Singapore, particularly in the areas of appointment scheduling, billing, and medication prescription. Currently, patients often experience long waiting times when trying to book appointments and deal with inefficient billing processes. Additionally, there is a lack of digital systems for doctors to conveniently manage medication prescriptions, which can slow down patient care.  

The goal of this web application is to streamline these key processes by offering an easy-to-use platform where patients can schedule appointments, manage billing, and receive medication prescriptions directly through the system. By improving the accessibility and efficiency of these core functions, the application will reduce the administrative burden on clinic staff, minimize patient wait times, and enhance overall patient satisfaction.


## Polyclinic System Docker Setup


### Prerequisites

1. **Install Docker**:
   - Download and install Docker Desktop from [Docker's official website](https://www.docker.com/products/docker-desktop).
   - Ensure Docker is running before proceeding.

2. **Install Docker Compose**:
   - Docker Compose is bundled with Docker Desktop. To verify installation, run:
     ```bash
     docker-compose --version
     ```

3. **Set Up Your Database**:
   - You must configure your own MySQL or MongoDB instance. The application will connect to the database based on the environment variables you provide.

---

## How to Run

### 1. Clone the Repository
Clone the project repository to your local machine:

### 2. Set up Environment Variables
The environment requires some variables to be defined for database connectivity and application behavior. Create an .env file in the root directory with the following structure:  

```
# Database Configuration
DB_HOST=<your-database-host>
DB_PORT=<your-database-port>
DB_USER=<your-database-username>
DB_PASSWORD=<your-database-password>
DB_NAME=<your-database-name>

# Other Settings
VITE_APP_USE_SQL=TRUE
```

### 3. Build and Run the Services 
``` docker-compose up --build ```


This will:

Build the backend, webapp, and server-node services.
Expose ports as defined in the docker-compose.yml file:
Backend: 5000
Webapp: 5173
Server Node: 5001
