import React from 'react';
import { SafeAreaView, Text, Button } from 'react-native';
import * as Google from 'expo-google-app-auth';
import firebase from 'firebase';
import { firebaseConfig } from '../../config';

export default function LoginScreen() {

  const isUserEqual = (googleUser, firebaseUser) => {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
            providerData[i].uid === googleUser.getBasicProfile().getId()) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  }

  const onSignIn = (googleUser) => {
    console.log('Google Auth Response', googleUser);
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
      unsubscribe();
      // Check if we are already signed-in Firebase with the correct user.
      if (!isUserEqual(googleUser, firebaseUser)) {
        // Build Firebase credential with the Google ID token.
        var credential = firebase.auth.GoogleAuthProvider.credential(
          googleUser.idToken,
          googleUser.accessToken
        );
        // Sign in with credential from the Google user.
        firebase.auth().signInWithCredential(credential).then((result) => {
          console.log('user signed in');
          firebase.database().ref('/users/'+ result.user.uid).set({
            gmail: result.user.email,
            profile_picture: result.additionalUserInfo.profile.picture,
            locale: result.additionalUserInfo.profile.locale,
            first_name: result.additionalUserInfo.profile.given_name,
            last_name: result.additionalUserInfo.profile.family_name
          })
        }).catch((error) => {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
      } else {
        console.log('User already signed-in Firebase.');
      }
    });
  }

  const signInWithGoogleAsync = async () => {
    try {
      const result = await Google.logInAsync({
        iosClientId: '369936574538-315qabo1mbcob82obiolndgeattrfgup.apps.googleusercontent.com',
      });
      if (result.type === 'success') {
        onSignIn(result);
        return result.accessToken;
      } 
    } catch (e) {
      return { error: true };
    }
  }

  return(
    <SafeAreaView style={{ flex:1, alignItems: "center", justifyContent: "center"}}>
      <Button 
        title='Sing In With Google' 
        onPress={() => signInWithGoogleAsync()}
      />
    </SafeAreaView>
  );
}