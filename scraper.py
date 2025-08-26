import requests
from bs4 import BeautifulSoup
import pandas as pd

# Define the URL and headers (to mimic a real browser request)
url = "https://deals.sharewareonsale.com/collections/apps-software/utilities?page=3"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Send a GET request to the URL
response = requests.get(url, headers=headers)

# Check if the request was successful
if response.status_code == 200:
    # Parse the HTML content with BeautifulSoup
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Initialize a list to store the scraped data
    data = []
    
    # Example: Extract data from all product items (replace selectors with actual classes/tags)
    # Inspect the webpage to find the correct HTML elements (e.g., product cards)
    products = soup.select(".product-item")  # Replace ".product-item" with the actual class/tag
    
    for product in products:
        try:
            name = product.select_one(".product-name").text.strip()  # Replace ".product-name"
            price = product.select_one(".product-price").text.strip()  # Replace ".product-price"
            link = product.select_one("a")["href"]  # Replace "a" if the link is in a different tag
            data.append({"Name": name, "Price": price, "Link": link})
        except Exception as e:
            print(f"Error extracting data: {e}")
    
    # Save data to Excel using pandas
    df = pd.DataFrame(data)
    df.to_excel("scraped_data.xlsx", index=False)
    print("Data saved to scraped_data.xlsx")
else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")