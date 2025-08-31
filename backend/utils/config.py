#Load .env file
from dotenv import load_dotenv
load_dotenv()
import os
import weaviate
import weaviate.classes as wvc
import weaviate.classes.config as wc
import logging
from weaviate.classes.config import Configure
from google import genai
import requests
import json
import pandas as pd
import sqlite3
from tqdm import tqdm

#Set up logging
from logging.handlers import TimedRotatingFileHandler

def setup_logger():
    # Create a logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)  # Set the log level

    # Create a formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # Create a TimedRotatingFileHandler
    file_handler = TimedRotatingFileHandler('log/app.log', when='midnight', interval=1, backupCount=7)
    file_handler.setLevel(logging.INFO)  # Set log level for the file
    file_handler.setFormatter(formatter)  # Set formatter for file handler

    # Create console handler
    # console_handler = logging.StreamHandler()  # Log to console
    # console_handler.setLevel(logging.INFO)  # Set log level for the console
    # console_handler.setFormatter(formatter)  # Set formatter for console handler

    # Add the handlers to the logger
    logger.addHandler(file_handler)
    # logger.addHandler(console_handler)

    # Ensure the log file is created at midnight
    file_handler.suffix = "%Y-%m-%d.log"  # Optional: Set a suffix for the log files


# Model chat
MODEL_ENDPOINT = os.getenv("model_endpoint")
MODEL_KEY = os.getenv("model_key")

# Embedding
EMBEDDING_API_ENDPOINT = os.getenv("embed_endpoint")
print(EMBEDDING_API_ENDPOINT) 

deploy_model_name = os.getenv("deploy_model_name")

class Model:
    def __init__(self):
            self.client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY"),
        )
        
        # self.client_embed = OpenAI(
        #     base_url=EMBEDDING_API_ENDPOINT,
        #     # api_key=EMBEDDING_API_KEY,
        # )

class VectorDB:
    def __init__(self):
        self.client_weaviate = None
    
    def connect_to_weaviate(self):
        #Connect to Weaviate
        try:    
            #Set up db
            self.client_weaviate = weaviate.connect_to_local(
                skip_init_checks=True, 
            )
            logging.info("Connected to vector db")
        except Exception as e:
            logging.error(f"Error connecting to vector db: {e}")

    def create_question_answer_vector_db(self):
        try:
            #Set up question vector db
            if self.client_weaviate.collections.exists("Question_Answer"):
                logging.info("Question_Answer vector db exists")
                return

            self.client_weaviate.collections.create(
                name="Question_Answer",
                properties=[
                    wc.Property(name="question_embed", data_type=wc.DataType.NUMBER_ARRAY),
                    wc.Property(name="question", data_type=wc.DataType.TEXT),
                    wc.Property(name="answer", data_type=wc.DataType.TEXT),
                    # wc.Property(name="user_id", data_type=wc.DataType.NUMBER),
                    # wc.Property(name="msg_id", data_type=wc.DataType.NUMBER),
                    # wc.Property(name="conversation_id", data_type=wc.DataType.NUMBER),
                    wc.Property(name="count", data_type=wc.DataType.NUMBER),
                ],

                # vectorizer_config=[
                #     Configure.NamedVectors.text2vec_openai(
                #         name="question_embed",
                #         source_properties=["question"],
                #         model="text-embedding-nomic-embed-text-v1.5"
                #     )
                # ],
            )
            logging.info("Created Question_Answer vector db")
        except Exception as e:
            # raise(e)
            logging.error(f"Error creating Question_Answer vector db: {e}")
        
    def create_frequent_answer_vector_db(self):
        try:
            #Set up question vector db
            if self.client_weaviate.collections.exists("Frequent_Answer"):
                logging.info("Frequent_Answer vector db exists")
                return

            self.client_weaviate.collections.create(
                name="Frequent_Answer",
                properties=[
                    wc.Property(name="question", data_type=wc.DataType.TEXT),
                    wc.Property(name="answer", data_type=wc.DataType.TEXT),
                    # wc.Property(name="user_id", data_type=wc.DataType.NUMBER),
                    # wc.Property(name="msg_id", data_type=wc.DataType.NUMBER),
                    # wc.Property(name="conversation_id", data_type=wc.DataType.NUMBER),
                    wc.Property(name="count", data_type=wc.DataType.NUMBER),
                ],

                # vectorizer_config=[
                #     Configure.NamedVectors.text2vec_openai(
                #         name="question_embed",
                #         source_properties=["question"],
                #         model="text-embedding-nomic-embed-text-v1.5"
                #     )
                # ],
            )
            logging.info("Created Frequent_Answer vector db")
        except Exception as e:
            # raise(e)
            logging.error(f"Error creating Frequent_Answer vector db: {e}")
            
    def create_data_vector_db(self, name):
        try:
            #Set up question vector db
            if self.client_weaviate.collections.exists(name):
                logging.info(f"{name} vector db exists")
                return

            self.client_weaviate.collections.create(
                name=name,
                properties=[
                    wc.Property(name="act", data_type=wc.DataType.TEXT),
                    wc.Property(name="scene", data_type=wc.DataType.TEXT),
                    wc.Property(name="context", data_type=wc.DataType.TEXT),
                ],

                # vectorizer_config=[
                #     Configure.NamedVectors.text2vec_openai(
                #         name="question_embed",
                #         source_properties=["question"],
                #         model="text-embedding-nomic-embed-text-v1.5"
                #     )
                # ],
            )
            logging.info(f"Created {name} vector db")
        except Exception as e:
            # raise(e)
            logging.error(f"Error creating {name} vector db: {e}")

    def embed(self, message):
        url = EMBEDDING_API_ENDPOINT + '/embeddings'
        # print(f"Embedding message: {message}")
        # print(f"Embedding url: {url}")
        headers = {
            "Content-Type": "application/json",
            "zrok-skip-browser-warning": "69420"
        }
        response = requests.post(url, headers=headers, data=json.dumps({
            "model": "text-embedding-nomic-embed-text-v1.5",
            "input": message
        }))
        return response.json()
    
    def populate_data_1(self):
        # Knoledge Base 1
        # Specify the path to your CSV file

        # Specify the path to your SQLite database file
        db_file_path = 'your_database.db'
        
        if not os.path.exists(db_file_path):
                

            play_list = []
            try:
                for play in tqdm(os.listdir('data/OneDrive_1_5-7-2025/Knowledge Base 1')):
                    
                    # Specify the name of the table you want to create or append to
                    table_name = ''.join(play[:-4].replace('_', '').split(' '))
                    play_list.append(table_name)
                    csv_file_path = f'data/OneDrive_1_5-7-2025/Knowledge Base 1/{play}'
                    # Read the CSV file into a pandas DataFrame
                    df = pd.read_csv(csv_file_path)
                    df.rename(columns={'text': 'line'}, inplace=True)

                    # Connect to the SQLite database (creates the file if it doesn't exist)
                    conn = sqlite3.connect(db_file_path)

                    # Write the DataFrame to the SQLite table
                    # if_exists='append': If the table exists, append new data.
                    # if_exists='replace': If the table exists, drop it, create a new one, and insert data.
                    # if_exists='fail': If the table exists, raise a ValueError.
                    df.to_sql(table_name, conn, if_exists='append', index=False)

                    # Close the database connection
                    conn.close()

                    tqdm.write(f"Data imported from {csv_file_path} to {db_file_path}")

                with open('data/play_list.txt', 'w') as f:
                    f.write(', '.join(play_list))
                
            except FileNotFoundError:
                print(f"Error: The CSV file was not found at '{csv_file_path}'. Please check the file path.")
            except Exception as e:
                print(f"An error occurred during the import process: {e}")
            finally:
                if 'conn' in locals() and conn:
                    conn.close()


        # setup_logger()

    def populate_data_2(self):
        # Knowledge base 2
        try:
            for play in tqdm(os.listdir('data/OneDrive_1_5-7-2025/Knowledge Base 2')):
                data = pd.read_csv(f'data/OneDrive_1_5-7-2025/Knowledge Base 2/{play}')
                table_name = ''.join(play[:-4].replace('_', '').split(' '))
                self.create_data_vector_db(table_name)
                data_vector = self.client_weaviate.collections.get(table_name)
                
                data_objs = []
                for _, row in data.iterrows():
                    context_embed = self.embed(row['text']) 
                    context_embed = context_embed["data"][0]["embedding"]  
                    data_objs.append(wvc.data.DataObject(
                        properties={
                            "act": str(row['act']),
                            "scene": str(row['scene']),
                            "context": row['text'],
                        },
                        vector=context_embed
                    ))
                    
                data_vector.data.insert_many(data_objs)
                
                tqdm.write(f"Data from '{play}' has been successfully imported into the '{table_name}' table.")
        except Exception as e:
            logging.error(f"An error occurred during the import process: {e}")
            import traceback
            traceback.print_exc()
    def close(self):
        self.client_weaviate.close()
        logging.info("Closed vector db")