from db_connection import get_db_connection, close_db_connection

def delete_and_reset_table(table_name):
    connection = None
    try:
        connection, tunnel = get_db_connection()

        with connection.cursor() as cursor:
            # Delete all records from the table
            delete_query = f"DELETE FROM {table_name};"
            cursor.execute(delete_query)

            # Reset the auto-increment value
            reset_index_query = f"ALTER TABLE {table_name} AUTO_INCREMENT = 1;"
            cursor.execute(reset_index_query)
            
            connection.commit()

        return {"status": "success", "message": f"All records in {table_name} have been deleted and index reset to 1."}

    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Status: error, Message: Error occurred: {str(e)}")
        return {"status": "error", "message": f"Error occurred: {str(e)}"}

    finally:
        if connection:
            close_db_connection(connection, tunnel)
