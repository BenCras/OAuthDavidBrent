import {Button, Text, View} from 'react-native';
import {exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery} from "expo-auth-session";
import * as WebBrowser from 'expo-web-browser';
import {useState} from "react";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
    // https://demo.duendesoftware.com/.well-known/openid-configuration
    const discovery = useAutoDiscovery('https://demo.duendesoftware.com');

    // Create and load an auth request
    const [request, , promptAsync] = useAuthRequest(
        {
            clientId: 'interactive.public',
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            usePKCE: true,
            redirectUri: makeRedirectUri({
                path: "redirect",
                scheme: "oauthdemo"
            }),
        },
        discovery
    );

    const [text, setText] = useState("");
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Button title="Login!" disabled={!request} onPress={() => {
                // Open browser to start authentication request
                promptAsync().then((result) => {
                    if (result.type !== "success") {
                        setText(`Login was unsuccessful (${result.type})`);
                        return;
                    }

                    // Check state
                    if (request.state !== result.params.state) {
                        // CSRF Attack?
                        setText(`Received state string does not match original string!
                         (${request.state} != ${result.params.state})`);
                        return;
                    }

                    // Auth was successful, we received an auth code
                    let walkthrough = `Authorization code: ${result.params.code}`;
                    setText(walkthrough);

                    // We exchange the code for an access token, giving the PKCE verifier string as proof we are
                    // the same application that originally requested an authorization code.
                    exchangeCodeAsync({
                        clientId: 'interactive.public',
                        redirectUri: request.redirectUri,
                        code: result.params.code,
                        extraParams: {
                            "code_verifier": request.codeVerifier
                        }
                    }, discovery)
                        .then((result) => {
                            // We received an access token, allowing us to
                            walkthrough = `${walkthrough}\n\nAccess Token: ${result.accessToken}`;
                            setText(walkthrough);
                            fetch("https://demo.duendesoftware.com/connect/userinfo", {
                                method: "GET",
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${result.accessToken}`,
                                }
                            }).then((result) => {
                                result.text().then((userinfo) => setText(`${walkthrough}\n\nUser info: ${userinfo}`));
                            })
                        })
                })
            }}/>
            {text && <Text>{text}</Text>}
        </View>
    );
}
