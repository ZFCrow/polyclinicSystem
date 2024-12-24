import bcrypt
import pandas as pd

# Load the CSV file into a DataFrame
df = pd.read_csv('Cleaned_Datasets/user.csv')

# Specify the column you want to hash
column_to_hash = 'password_hash'

# Function to hash a single value
def hash_value(value):
    # Convert the value to bytes and hash it
    hashed = bcrypt.hashpw(value.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

# Total number of rows
num_rows = df.shape[0]
print(f"Total rows to process: {num_rows}")

# Apply the hashing function to the specified column with progress printing
for idx, row in df.iterrows():
    df.at[idx, column_to_hash] = hash_value(row[column_to_hash])
    # Show progress every 1000 rows
    if (idx + 1) % 100 == 0 or idx + 1 == num_rows:
        print(f"Processed {idx + 1}/{num_rows} rows")

# Save the updated DataFrame to a new CSV file
df.to_csv('Cleaned_Datasets/hashed.csv', index=False)

print("Hashed CSV saved as 'hashed.csv'")
