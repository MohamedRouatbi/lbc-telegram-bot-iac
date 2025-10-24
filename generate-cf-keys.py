#!/usr/bin/env python3
"""
Generate RSA key pair for CloudFront signed URLs
"""

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Generate RSA key pair (2048 bits)
print("Generating RSA 2048-bit key pair...")
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

# Extract public key
public_key = private_key.public_key()

# Serialize private key to PEM format
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()
)

# Serialize public key to PEM format
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Write to files
with open('cloudfront-private-key.pem', 'wb') as f:
    f.write(private_pem)

with open('cloudfront-public-key.pem', 'wb') as f:
    f.write(public_pem)

print("✅ Keys generated successfully!")
print("\nPrivate key saved to: cloudfront-private-key.pem")
print("Public key saved to: cloudfront-public-key.pem")
print("\n" + "="*60)
print("PUBLIC KEY (copy this to AWS CloudFront Console):")
print("="*60)
print(public_pem.decode('utf-8'))
