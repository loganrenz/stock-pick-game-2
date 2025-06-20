interface AppleIDAuthInit {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  usePopup: boolean;
}

interface AppleIDAuthResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
}

interface AppleIDAuthError {
  error: string;
}

interface AppleID {
  auth: {
    init: (config: AppleIDAuthInit) => void;
  };
}

declare global {
  interface Window {
    AppleID: AppleID;
  }
} 