from db_connection import get_db_connection, close_db_connection

import pandas as pd
import pymysql
from pymysql import IntegrityError, OperationalError, DataError

def insert_data_from_csv(csv_file, table_name, chunksize=1000):
    connection = None
    inserted_rows = 0  # Counter to track the number of inserted rows
    try:
        connection, tunnel = get_db_connection()

        # Use chunking to read and process large CSVs in parts
        for chunk in pd.read_csv(csv_file, chunksize=chunksize):
            with connection.cursor() as cursor:
                cols = list(chunk.columns)

                if table_name == 'user':
                    if 'create_at' not in cols:
                        cols.append('create_at')
                        placeholders = ', '.join(['%s'] * (len(cols) - 1)) + ', NOW()'
                    else:
                        placeholders = ', '.join(['%s'] * len(cols))
                else:
                    placeholders = ', '.join(['%s'] * len(cols))

                cols_string = ', '.join(cols)
                insert_query = f"INSERT INTO {table_name} ({cols_string}) VALUES ({placeholders})"
                
                # Convert DataFrame to list of tuples
                rows = [tuple(row) for index, row in chunk.iterrows()]

                # Bulk insert using executemany
                cursor.executemany(insert_query, rows)
                inserted_rows += len(rows)

            # Commit after processing each chunk
            connection.commit()

        return {"status": "success", "message": f"{inserted_rows} rows inserted successfully into {table_name}."}

    except OperationalError as oe:
        print(f"OperationalError: Database operation failed - {str(oe)}")
        if connection:
            connection.rollback()

    except Exception as e:
        print(f"GeneralError: An error occurred - {str(e)}")
        if connection:
            connection.rollback()
        return {"status": "error", "message": f"Error occurred: {str(e)}"}

    finally:
        if connection:
            close_db_connection(connection, tunnel)



