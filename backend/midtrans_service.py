import requests
import base64
import os
import hashlib
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class MidtransService:
    def __init__(self):
        self.server_key = os.getenv("MIDTRANS_SERVER_KEY")
        self.client_key = os.getenv("MIDTRANS_CLIENT_KEY")
        self.environment = os.getenv("MIDTRANS_ENVIRONMENT", "sandbox")
        
        if self.environment == "production":
            self.base_url = "https://app.midtrans.com/snap/v1"
        else:
            self.base_url = "https://app.sandbox.midtrans.com/snap/v1"
        
        auth_string = f"{self.server_key}:"
        auth_bytes = auth_string.encode('utf-8')
        auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
        self.headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/json"
        }

    async def create_snap_token(self, order_id: str, gross_amount: float, customer_details: dict, item_details: list) -> str:
        payload = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount)
            },
            "customer_details": customer_details,
            "item_details": item_details,
            "credit_card": {
                "secure": True
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/transactions",
                json=payload,
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            token = data.get('token')
            if not token:
                logger.error(f"No token received from Midtrans: {data}")
                raise Exception("Failed to generate Snap token")
            return token
        except requests.exceptions.RequestException as e:
            logger.error(f"Midtrans API error: {str(e)}")
            raise Exception(f"Failed to create Snap token: {str(e)}")

    def verify_notification_signature(self, payload: dict, signature: str) -> bool:
        order_id = payload.get('order_id')
        status_code = payload.get('status_code')
        gross_amount = payload.get('gross_amount')
        
        data_to_verify = f"{order_id}{status_code}{gross_amount}{self.server_key}"
        expected_signature = hashlib.sha512(data_to_verify.encode()).hexdigest()
        
        return expected_signature == signature

midtrans_service = MidtransService()