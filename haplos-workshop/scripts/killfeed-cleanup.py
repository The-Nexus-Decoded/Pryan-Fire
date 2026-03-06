#!/usr/bin/env python3
"""
Killfeed Auto-Cleanup Script
Deletes messages older than 24 hours from killfeed channels.
Run via cron or OpenClaw scheduler.
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests

# Configuration
KILLFEED_CHANNELS = [
    "1479351943217549474",  # killfeed-killer
    "1479352987242729472",  # killfeed-alpha
    "1479353055844503663",  # killfeed-extreme
    "1479429269389181049",  # killfeed-toppools
]

# Discord API
DISCORD_BASE_URL = "https://discord.com/api/v10"
MESSAGE_AGE_HOURS = 24
BATCH_SIZE = 100  # Discord bulk delete limit

# Get token from environment
BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
if not BOT_TOKEN:
    print("ERROR: DISCORD_BOT_TOKEN environment variable not set")
    sys.exit(1)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def get_headers():
    return {
        "Authorization": f"Bot {BOT_TOKEN}",
        "Content-Type": "application/json"
    }


def get_channel_messages(channel_id: str, limit: int = 100):
    """Fetch messages from a channel."""
    url = f"{DISCORD_BASE_URL}/channels/{channel_id}/messages"
    params = {"limit": limit}
    
    try:
        resp = requests.get(url, headers=get_headers(), params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 429:
            logger.warning(f"Rate limited on channel {channel_id}, retrying...")
            time.sleep(5)
            return get_channel_messages(channel_id, limit)
        else:
            logger.error(f"Failed to get messages from {channel_id}: {resp.status_code} - {resp.text}")
            return []
    except Exception as e:
        logger.error(f"Exception fetching messages from {channel_id}: {e}")
        return []


def delete_message(channel_id: str, message_id: str):
    """Delete a single message."""
    url = f"{DISCORD_BASE_URL}/channels/{channel_id}/messages/{message_id}"
    
    try:
        resp = requests.delete(url, headers=get_headers(), timeout=10)
        return resp.status_code in (200, 204)
    except Exception as e:
        logger.error(f"Exception deleting message {message_id}: {e}")
        return False


def bulk_delete_messages(channel_id: str, message_ids: list):
    """Bulk delete messages (max 100 at a time)."""
    url = f"{DISCORD_BASE_URL}/channels/{channel_id}/messages/bulk-delete"
    payload = {"messages": message_ids}
    
    try:
        resp = requests.post(url, headers=get_headers(), json=payload, timeout=30)
        if resp.status_code in (200, 204):
            return True
        elif resp.status_code == 429:
            logger.warning(f"Rate limited during bulk delete, waiting...")
            time.sleep(5)
            return bulk_delete_messages(channel_id, message_ids)
        else:
            logger.error(f"Bulk delete failed for {channel_id}: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        logger.error(f"Exception during bulk delete: {e}")
        return False


def parse_message_timestamp(msg: dict) -> datetime:
    """Parse Discord message timestamp to datetime."""
    timestamp_str = msg.get("timestamp", "")
    if timestamp_str:
        return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    return datetime.now(timezone.utc)


def should_delete(msg: dict, cutoff: datetime) -> bool:
    """Check if message should be deleted based on age."""
    msg_time = parse_message_timestamp(msg)
    return msg_time < cutoff


def process_channel(channel_id: str, cutoff: datetime) -> int:
    """Process a single channel, delete old messages."""
    logger.info(f"Processing channel {channel_id}")
    
    messages = get_channel_messages(channel_id)
    if not messages:
        return 0
    
    # Filter messages older than cutoff
    old_messages = [msg for msg in messages if should_delete(msg, cutoff)]
    
    if not old_messages:
        logger.info(f"No messages older than {MESSAGE_AGE_HOURS}h in {channel_id}")
        return 0
    
    # Delete in batches
    deleted_count = 0
    for i in range(0, len(old_messages), BATCH_SIZE):
        batch = old_messages[i:i + BATCH_SIZE]
        message_ids = [msg["id"] for msg in batch]
        
        if bulk_delete_messages(channel_id, message_ids):
            deleted_count += len(message_ids)
            logger.info(f"Deleted {len(message_ids)} messages from {channel_id}")
        else:
            # Fallback to individual deletes
            logger.warning(f"Bulk delete failed, trying individual deletes...")
            for msg in batch:
                if delete_message(channel_id, msg["id"]):
                    deleted_count += 1
                time.sleep(0.25)  # Rate limit protection
    
    return deleted_count


def main():
    """Main entry point."""
    logger.info("Killfeed Auto-Cleanup started")
    
    # Calculate cutoff time (24 hours ago)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MESSAGE_AGE_HOURS)
    logger.info(f"Deleting messages older than {cutoff.isoformat()}")
    
    total_deleted = 0
    
    for channel_id in KILLFEED_CHANNELS:
        try:
            deleted = process_channel(channel_id, cutoff)
            total_deleted += deleted
            logger.info(f"Channel {channel_id}: deleted {deleted} messages")
        except Exception as e:
            logger.error(f"Error processing channel {channel_id}: {e}")
        
        # Rate limit protection between channels
        time.sleep(1)
    
    logger.info(f"Killfeed Auto-Cleanup complete. Total deleted: {total_deleted}")
    print(f"Deleted {total_deleted} messages from {len(KILLFEED_CHANNELS)} channels")


if __name__ == "__main__":
    main()
