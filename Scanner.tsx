import React, { useRef, useContext, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppContext } from './App';
import { format, isAfter, isEqual, isBefore } from 'date-fns';
import { ActivityIndicator } from 'react-native-paper';

const Sound = require('react-native-sound');
Sound.setCategory('Playback');

const beep = new Sound('beep_short.mp3', Sound.MAIN_BUNDLE, (error: any) => {
  if (error) {
    console.log('failed to load the sound', error);
    return;
  }
});

export default function Scanner({ navigation }: any) {
  const ref = useRef(null);
  const [barcode, setBarCode] = useState<any>({ data: null, type: null });
  const { state } = useContext(AppContext);
  const [slots, setSlots]: any = useState<any>(null);
  const dateStr = format(new Date(), 'YYYY-MM-DD');

  useEffect(() => {
    const getPlan = () => {
      fetch(`http://localhost:3000/schedule/${dateStr}`)
        .then(res => res.json())
        .then(json => {
          console.log(json.data.slots);
          setSlots(json.data.slots);
        });
    };
    getPlan();
    return () => {};
  }, []);

  useEffect(() => {
    const focusEvt = navigation.addListener('didFocus', () => {
      setBarCode({ data: null, type: null });
    });
    return () => {
      focusEvt.remove();
    };
  }, []);

  useEffect(() => {
    if (!barcode.data) {
      return;
    }
    if (state.beepOn) {
      beep.play((success: any) => {
        if (success) {
          console.log('successfully finished playing');
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });
    }
    navigation.navigate('ScanInfo', { barcode });
    const time = new Date();
    const slot = slots.find((slot: any) => {
      if (
        (isAfter(time, slot.startTime) || isEqual(time, slot.startTime)) &&
        isBefore(time, slot.endTime)
      ) {
        return true;
      }
      return false;
    });

    if (!slot) {
      return;
    }

    console.log(
      slot,
      JSON.stringify({
        slotId: slot.id,
        scandata: { data: barcode.data, type: barcode.type }
      })
    );

    try {
      fetch(`http://localhost:3000/schedule/scans/${dateStr}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slotId: slot.id,
          scandata: { data: barcode.data, type: barcode.type }
        })
      });
    } catch (err) {
      console.log(err);
    }
  }, [barcode.data]);

  const onBarCodeRead = ({ data, type }: any) => {
    setBarCode({ data, type });
  };

  if (!slots) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" />
        <Text style={{ marginTop: 12 }}>Loading plan...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <RNCamera
        ref={ref}
        onBarCodeRead={onBarCodeRead}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.on}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel'
        }}
        androidRecordAudioPermissionOptions={{
          title: 'Permission to use audio recording',
          message: 'We need your permission to use your audio',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel'
        }}
      />

      <View style={styles.interface}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 18, right: 18 }}
          onPress={() => {
            navigation.navigate('Settings');
          }}
        >
          <Icon size={48} name="settings" color="#3b5998" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  interface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20
  }
});
