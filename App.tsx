/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 *
 * @format
 */

import React, { useEffect, useState, useReducer, useContext } from 'react';
import { Text, View, PermissionsAndroid, Alert, Switch } from 'react-native';
import nodejs from 'nodejs-mobile-react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {
  Provider as PaperProvider,
  Title,
  Divider,
  Subheading,
  ActivityIndicator
} from 'react-native-paper';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import Scanner from './Scanner';

type ScreenType = 'SCANNER' | 'SETTINGS' | 'SCAN_INFO' | 'DASHBOARD';

export interface State {
  screen: ScreenType;
  beepOn: boolean;
  rehydrated: boolean;
}

export type Action =
  | { type: 'CHANGE_SCREEN'; payload: ScreenType }
  | { type: 'REHYDRATE'; payload: any }
  | { type: 'CHANGE_BEEP_SOUND'; payload: boolean };

const initialState: State = {
  screen: 'SCANNER',
  beepOn: true,
  rehydrated: false
};

export const AppContext = React.createContext<{
  state: State;
  dispatch: (action: Action) => void;
}>({ state: initialState, dispatch: () => {} });

const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CHANGE_SCREEN':
      return {
        ...state,
        screen: action.payload
      };
    case 'CHANGE_BEEP_SOUND':
      return {
        ...state,
        beepOn: action.payload
      };
    case 'REHYDRATE':
      return { ...action.payload, rehydrated: true };
    default:
      throw new Error('Unrecognized action!');
  }
};

function Settings() {
  const { state, dispatch } = useContext(AppContext);

  return (
    <View>
      <View
        style={{
          padding: 8
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Subheading>Scanner sound on</Subheading>
          <Switch
            value={state.beepOn}
            onValueChange={value =>
              dispatch({ type: 'CHANGE_BEEP_SOUND', payload: value })
            }
          />
        </View>
        <View style={{ height: 8 }} />
        <Divider />
      </View>
    </View>
  );
}

function ScanInfo({ navigation }: any) {
  return (
    <View style={{ padding: 8 }}>
      <Title>Type</Title>
      <Subheading>{navigation.state.params.barcode.type}</Subheading>
      <Title>Data</Title>
      <Subheading>{navigation.state.params.barcode.data}</Subheading>
    </View>
  );
}

const AppNavigator = createStackNavigator({
  Scanner: {
    screen: Scanner,
    navigationOptions: {
      header: null
    }
  },
  Settings: {
    screen: Settings,
    navigationOptions: {
      title: 'Settings'
    }
  },
  ScanInfo: {
    screen: ScanInfo,
    navigationOptions: {
      title: 'Scan Information'
    }
  }
});

const UI = createAppContainer(AppNavigator);

export default function App() {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = React.useMemo(() => {
    return {
      state,
      dispatch
    };
  }, [state]);

  useEffect(() => {
    if (!state.rehydrated) {
      return;
    }
    const setPersistedState = async () => {
      const { rehydrated, ...rest } = state;
      await AsyncStorage.setItem('@APP_DATA', JSON.stringify(rest));
    };
    setPersistedState();
  }, [state]);

  useEffect(() => {
    const getPersistedState = async () => {
      const value = await AsyncStorage.getItem('@APP_DATA');

      if (value !== null) {
        dispatch({
          type: 'REHYDRATE',
          payload: JSON.parse(value)
        });
      }
    };
    getPersistedState();
  }, []);

  useEffect(() => {
    const getPermissions = async () => {
      const writeGrant = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Write to storage',
          message:
            'Cool Storage App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK'
        }
      );
      if (writeGrant === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('has permissons');
        nodejs.start('main.js');
        nodejs.channel.addListener('message', (msg: any) => {
          if (msg === 'Dev app listening on port 3000!') {
            setHasPermissions(true);
          }
        });
      } else {
        Alert.alert('Storage permission denied');
      }
    };
    getPermissions();
  });

  if (!hasPermissions) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <PaperProvider>
        <UI />
      </PaperProvider>
    </AppContext.Provider>
  );
}
