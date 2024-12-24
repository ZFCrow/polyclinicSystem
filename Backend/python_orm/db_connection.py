# db_connection.py
import os
from dotenv import load_dotenv
from sshtunnel import SSHTunnelForwarder
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

# SSH and Database Configuration
ssh_host = os.getenv('SSH_HOST')
ssh_username = os.getenv('SSH_USERNAME')
ssh_password = os.getenv('SSH_PASSWORD')
ssh_local_port = int(os.getenv('SSH_LOCAL_PORT'))
ssh_remote_port = int(os.getenv('SSH_REMOTE_PORT'))
mysql_user = os.getenv('MYSQL_USER')
mysql_password = os.getenv('MYSQL_PASSWORD')
mysql_db = os.getenv('MYSQL_DB')

# Initialize SQLAlchemy instance globally
db = SQLAlchemy()

# Global instance for SSH tunnel
ssh_tunnel = None

def setup_db(app):
    global ssh_tunnel
    if not ssh_tunnel:
        # Initialize the SSH tunnel if it’s not started yet
        ssh_tunnel = SSHTunnelForwarder(
            (ssh_host, 22),
            ssh_username=ssh_username,
            ssh_password=ssh_password,
            remote_bind_address=('127.0.0.1', ssh_remote_port),
            local_bind_address=('127.0.0.1', ssh_local_port)
        )
        ssh_tunnel.start()
        print(f"SSH Tunnel established on port {ssh_local_port}")

    # Configure SQLAlchemy with the app
    app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{mysql_user}:{mysql_password}@127.0.0.1:{ssh_tunnel.local_bind_port}/{mysql_db}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "pool_size": 10,
        "max_overflow": 5,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "isolation_level": "READ COMMITTED",
    }

    # Bind SQLAlchemy to the app
    db.init_app(app)
    print ("database uri: ", app.config['SQLALCHEMY_DATABASE_URI']) 
    
def close_ssh_tunnel():
    global ssh_tunnel
    if ssh_tunnel:
        ssh_tunnel.stop()
        print("SSH Tunnel closed")
