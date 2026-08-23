import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "";
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? "";

export const cognitoEnabled = Boolean(poolId && clientId);

function pool(): CognitoUserPool {
  return new CognitoUserPool({ UserPoolId: poolId, ClientId: clientId });
}

function cognitoMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "Something went wrong.";
  if (message.includes("NotAuthorizedException") || message.includes("UserNotFound")) {
    return "Email or password is wrong.";
  }
  return message;
}

export function signInCognito(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool() });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess(session: CognitoUserSession) {
        resolve(session.getIdToken().getJwtToken());
      },
      onFailure(err: Error) {
        reject(new Error(cognitoMessage(err)));
      },
    });
  });
}

export function signOutCognito(): void {
  pool().getCurrentUser()?.signOut();
}
