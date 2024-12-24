import os
from sshtunnel import SSHTunnelForwarder
import pymysql
from dotenv import load_dotenv
from dbutils.pooled_db import PooledDB 

# Load environment variables from .env file
load_dotenv()

# SSH and MySQL configuration from .env file
ssh_host = os.getenv('SSH_HOST')
ssh_username = os.getenv('SSH_USERNAME')
ssh_password = os.getenv('SSH_PASSWORD')

mysql_user = os.getenv('MYSQL_USER')
mysql_password = os.getenv('MYSQL_PASSWORD')
mysql_db = os.getenv('MYSQL_DB')

ssh_local_port = int(os.getenv('SSH_LOCAL_PORT'))
ssh_remote_port = int(os.getenv('SSH_REMOTE_PORT'))

# SSH tunnel as a global variable to ensure it runs only once
ssh_tunnel = None

# Initialize the connection pool (using PooledDB)
pool = None

def create_ssh_tunnel():
    global ssh_tunnel
    if not ssh_tunnel:
        # Create the SSH tunnel only once
        ssh_tunnel = SSHTunnelForwarder(
            (ssh_host, 22),
            ssh_username=ssh_username,
            ssh_password=ssh_password,
            remote_bind_address=('127.0.0.1', ssh_remote_port),
            local_bind_address=('127.0.0.1', ssh_local_port)
        )
        ssh_tunnel.start()
        print(f"SSH Tunnel established on port {ssh_local_port}")

def create_connection_pool():
    global pool
    if not pool:
        # Create the SSH tunnel before creating the connection pool
        create_ssh_tunnel()

        # Set up the connection pool
        pool = PooledDB(
            creator=pymysql,
            maxconnections=10,  # Adjust the number of connections as needed
            mincached=2,        # Minimum number of idle connections
            maxcached=5,        # Maximum number of idle connections
            blocking=True,      # Block if the pool is exhausted
            host='127.0.0.1',
            user=mysql_user,
            password=mysql_password,
            database=mysql_db,
            port=ssh_local_port
        )
        print("Connection pool created")

def get_db_connection():
    if not pool:
        create_connection_pool()

    # Get a connection from the pool
    connection = pool.connection()
    return connection

def close_db_connection(connection):
    connection.close()  # Return the connection to the pool
    print("Database connection returned to pool from function")

def close_ssh_tunnel():
    global ssh_tunnel
    if ssh_tunnel:
        ssh_tunnel.stop()
        ssh_tunnel = None
        print("SSH tunnel closed")
