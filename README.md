## To run the project

1. `git clone https://github.com/parallellearning/bomdila.git`
2. `cd bomdila`
3. Create signing keys and copy signing credentials to android/key.properties
```
keytool -genkey -v -keystore ~/keys/mobileapp/key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mobileapp
```
4. `yarn install` | `npm install`
5. `react-native run-android`


### Components

1. Express Server located at `nodejs-assets/nodejs-project/`
2. React Native barcode Scaning App

### How to use the app

1. After running the app switch over to mobile browser app and open `http://localhost:3000/#plan`
2. The plan tab displays various time sections for which barcode scanning details need to be collected.
3. Add few rows that you find relevant to your time.
4. Switch over to the app and scan any barcode. The data is sent to the server and the server updates the count of scans for that particular time window.
