// Use Pinata REST API directly instead of SDK to avoid CommonJS issues
// This is more reliable for browser environments
const getPinataClient = async (): Promise<any | null> => {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  
  if (!jwt) {
    console.warn('VITE_PINATA_JWT not set. IPFS uploads will be disabled.');
    return null;
  }

  // Return a simple client object that uses Pinata REST API
  return {
    jwt,
    gateway: import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud',
  };
};

/**
 * Upload data to IPFS via Pinata
 * @param data - The data to upload (string, object, or File)
 * @returns IPFS hash (CID) or empty string if Pinata is not configured
 */
export const uploadToIPFS = async (data: string | object | File): Promise<string> => {
  const client = await getPinataClient();
  
  if (!client) {
    console.warn('Pinata not configured. Skipping IPFS upload. Data will be stored locally only.');
    return ''; // Return empty string if Pinata is not configured
  }

  try {
    // Prepare data for upload
    let content: string | Blob;
    
    if (typeof data === 'string') {
      content = data;
    } else if (data instanceof File) {
      content = data;
    } else {
      content = JSON.stringify(data);
    }

    // Use Pinata REST API directly
    const formData = new FormData();
    
    if (content instanceof File || content instanceof Blob) {
      formData.append('file', content);
    } else {
      // For JSON strings, create a Blob
      const blob = new Blob([content], { type: 'application/json' });
      formData.append('file', blob);
    }

    // Add metadata
    const metadata = JSON.stringify({
      name: `checkin-${Date.now()}`,
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    // Pinata returns an object with IpfsHash
    const ipfsHash = result.IpfsHash || result.Hash;
    
    if (!ipfsHash) {
      throw new Error('Failed to get IPFS hash from Pinata response');
    }

    return ipfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Return empty string on error instead of throwing
    // This allows the app to continue working without IPFS
    console.warn('Continuing without IPFS hash. Data will be stored locally only.');
    return '';
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

