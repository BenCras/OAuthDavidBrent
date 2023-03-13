import {Button, Text, View} from 'react-native';
import {makeRedirectUri, useAuthRequest, useAutoDiscovery} from "expo-auth-session";
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
const useProxy = true;
const redirectUri = makeRedirectUri({
    useProxy,
});

export default function App() {
    const discovery = useAutoDiscovery('https://demo.duendesoftware.com');
    // Create and load an auth request
    const [request, result, promptAsync] = useAuthRequest(
        {
            clientId: 'interactive.confidential',
            redirectUri,
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            usePKCE: true,
        },
        discovery
    );
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Button title="Login!" disabled={!request} onPress={() => promptAsync({useProxy})}/>
            {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
        </View>
    );
}
