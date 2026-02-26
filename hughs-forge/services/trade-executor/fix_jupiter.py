import re

with open("main.py", "r") as f:
    content = f.read()

# Fix imports
content = re.sub(
    r'# from jupiter_solana import Jupiter, JupiterKeys, SolClient, JupReferrerAccount # Commented out Jupiter imports',
    'from solana.rpc.api import Client\nfrom jupiter_solana import Jupiter',
    content
)

# Fix Jupiter initialization
init_old = """        # self.sol_client = SolClient(rpc_endpoint)
        # self.jupiter_client = Jupiter(
        #     self.sol_client,
        #     jupiter_keys=JupiterKeys(),
        #     referrer=JupReferrerAccount()
        # )"""
init_new = """        self.sync_client = Client(rpc_endpoint)
        self.jupiter_client = Jupiter(self.sync_client)
        if self.wallet:
            self.jupiter_client.keypair = self.wallet"""
content = content.replace(init_old, init_new)

with open("main.py", "w") as f:
    f.write(content)

