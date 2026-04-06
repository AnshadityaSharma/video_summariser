import nltk
import ssl

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

nltk.data.path.append("./nltk_data")
nltk.download("wordnet", download_dir="./nltk_data")
nltk.download("omw-1.4", download_dir="./nltk_data")
nltk.download("stopwords", download_dir="./nltk_data")

print("NLTK data downloaded successfully.")
