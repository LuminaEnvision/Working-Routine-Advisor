// Lazy import PinataSDK to avoid build errors if not needed
let PinataSDK: any = null;
let pinataClient: any = null;

const getPinataClient = async (): Promise<any | null> => {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  
  if (!jwt) {
    console.warn('VITE_PINATA_JWT not set. IPFS uploads will be disabled.');
    return null;
  }

  if (!PinataSDK) {
    try {
      // Dynamic import to avoid build errors
      const pinataModule = await import('pinata-sdk');
      PinataSDK = pinataModule.default || pinataModule;
    } catch (error) {
      console.warn('Pinata SDK not available. IPFS uploads will be disabled:', error);
      return null;
    }
  }

  if (!pinataClient && PinataSDK) {
    try {
      pinataClient = new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud',
      });
    } catch (error) {
      console.error('Failed to initialize Pinata client:', error);
      return null;
    }
  }

  return pinataClient;
};

/**
 * Upload data to IPFS via Pinata
 * @param data - The data to upload (string, object, or File)
 * @returns IPFS hash (CID)
 */
export const uploadToIPFS = async (data: string | object | File): Promise<string> => {
  const client = await getPinataClient();
  
  if (!client) {
    throw new Error('Pinata client not initialized. Please set VITE_PINATA_JWT environment variable.');
  }

  try {
    let content: string | File;
    
    if (typeof data === 'string') {
      content = data;
    } else if (data instanceof File) {
      content = data;
    } else {
      content = JSON.stringify(data);
    }

    const result = await client.upload.content(content);
    
    // Pinata returns an object with IpfsHash or Hash
    const ipfsHash = result.IpfsHash || result.Hash || result.cid;
    
    if (!ipfsHash) {
      throw new Error('Failed to get IPFS hash from Pinata response');
    }

    return ipfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get IPFS gateway URL for a hash
 * @param ipfsHash - IPFS hash (CID)
 * @returns Gateway URL
 */
export const getIPFSGatewayURL = (ipfsHash: string): string => {
  const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
  return `https://${gateway}/ipfs/${ipfsHash}`;
};

/**
 * Fetch data from IPFS
 * @param ipfsHash - IPFS hash (CID)
 * @returns Fetched data as text
 */
export const fetchFromIPFS = async (ipfsHash: string): Promise<string> => {
  const url = getIPFSGatewayURL(ipfsHash);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('IPFS fetch failed:', error);
    throw new Error(`Failed to fetch from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

