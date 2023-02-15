/* Descripció de components
Importació de llibreries i components */
import React, {
  Component
} from 'react';
import Button from './components/uis/Button'; //importem el component Button que esta ubicat en la carpeta components/uis
import RNFetchBlob from 'rn-fetch-blob'; //importem la llibreria rn-fetch-blob
import type {
  ReactElement
} from 'react';

//Importem les següents constants, interfícies i mètodes de la llibreria react-native-audio-recorder-player
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import type {
  AudioSet,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface State {
  isLoggingIn: boolean; //un booleà que determina si l'usuari està connectat o no
  recordSecs: number; //nombre de segons que s'han enregistrat
  recordTime: string; //temps que s'ha enregistrat en format hh:mm:ss
  currentPositionSec: number; //posició actual del reproductor
  currentDurationSec: number; //durada total del fitxer que es reprodueix
  playTime: string; //temps transcorregut en la reproducció en format hh:mm:ss
  duration: string; //durada total del fitxer que es reprodueix en format hh:mm:ss
}

const screenWidth = Dimensions.get('screen').width; //amplada de la pantalla del dispositiu

class Page extends Component < any, State > { //creem una classe Page que extén la classe Component i que té un estat amb les propietats especificades anteriorment
      private dirs = RNFetchBlob.fs.dirs; //directoris del sistema de fitxers
      private path = Platform.select({ //obtenim la ruta del sistema de fitxers que varia segons la plataforma
          ios: undefined,
          android: undefined,
      });

      private audioRecorderPlayer: AudioRecorderPlayer; //instanciem l'objecte AudioRecorderPlayer

      constructor(props: any) { //constructor de la classe
          super(props); //crida al constructor de la classe pare
          this.state = { //definim l'estat inicial de l'aplicació
              isLoggingIn: false,
              recordSecs: 0,
              recordTime: '00:00:00',
              currentPositionSec: 0,
              currentDurationSec: 0,
              playTime: '00:00:00',
              duration: '00:00:00',
          };

          this.audioRecorderPlayer = new AudioRecorderPlayer(); //instanciem un nou objecte AudioRecorderPlayer
          this.audioRecorderPlayer.setSubscriptionDuration(0.1); //establim la durada de la subscripció de l'objecte AudioRecorderPlayer
      }  

  
  private onStatusPress = (e: any): void => { // Aquesta funció es crida quan es prem la barra de progrés de l'àudio i calcula la posició en la que s'ha fet clic.
    const touchX = e.nativeEvent.locationX; // Obtenim la posició en la que s'ha fet clic
    console.log(`touchX: ${touchX}`);

     // Calculem l'amplada de la barra de progrés que s'ha de reproduir
    const playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);
    console.log(`currentPlayWidth: ${playWidth}`);

    const currentPosition = Math.round(this.state.currentPositionSec);

    // Si s'ha fet clic en una posició a la dreta de la barra de progrés, saltem 1000 mil·lisegons endavant
    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + 1000);
      this.audioRecorderPlayer.seekToPlayer(addSecs);
      console.log(`addSecs: ${addSecs}`);
    } else {
      // Si s'ha fet clic en una posició a l'esquerra de la barra de progrés, saltem 1000 mil·lisegons enrere
      const subSecs = Math.round(currentPosition - 1000);
      this.audioRecorderPlayer.seekToPlayer(subSecs);
      console.log(`subSecs: ${subSecs}`);
    }
  };

  //Amb aquest metode donem els permisos necesaris a la app per llegir i escriure en el emmagatzematge extern del dispositiu android
  private onStartRecord = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
         // Demanem els permisos necessaris
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if ( // Si tots els permisos estan concedits, mostrem un missatge per consola
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissos garantits');
        } else {
          // Si algun dels permisos no esta concedit, mostrem un missatge d'error
          console.log('Permissos no garantits, error');

          return;
        }
      } catch (err) {
        console.warn(err);

        return;
      }
    }

    // Definim un conjunt de paràmetres d'àudio per la gravació
    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
      OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
    };
    // Mostrem el conjunt de paràmetres d'àudio per la gravació en la consola
    console.log('audioSet', audioSet);
    // Comencem a gravar l'àudio amb els paràmetres definits anteriorment i obtenim la URI de l'arxiu de gravació
    const uri = await this.audioRecorderPlayer.startRecorder(
      this.path,
      audioSet,
    );
    // Afegim un listener de l'esdeveniment de gravació, actualitzant l'estat de la gravació a mesura que avança el temps
    this.audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
      this.setState({
        recordSecs: e.currentPosition,
        recordTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.currentPosition),
        ),
      });
    });
    // Mostrem la URI de l'arxiu de gravació en la consola
    console.log(`uri: ${uri}`);
  };
  // Aquest mètode pausa la gravació d'àudio .
  private onPauseRecord = async (): Promise<void> => {
    try {
      const r = await this.audioRecorderPlayer.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }
  };

  // Aquest mètode reanuda la gravació d'àudio si aquesta s'ha pausat anteriorment.
  private onResumeRecord = async (): Promise<void> => {
    await this.audioRecorderPlayer.resumeRecorder();
  };

  // Aquest mètode atura la gravació d'àudio i elimina el listener per a les dades de gravació. També reinicia el valor del temps de gravació.
  private onStopRecord = async (): Promise<void> => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recordSecs: 0,
    });
    console.log(result);
  };

  // Aquest mètode comença la reproducció d'un fitxer d'àudio i afegeix un listener per a les dades de reproducció.
  private onStartPlay = async (): Promise<void> => {
    console.log('onStartPlay', this.path);

    try {
      const msg = await this.audioRecorderPlayer.startPlayer(this.path);

      const volume = await this.audioRecorderPlayer.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      this.audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        console.log('playBackListener', e);
        this.setState({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          playTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
          duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        });
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  // Aquest mètode pausa la reproducció d'un fitxer d'àudio.
  private onPausePlay = async (): Promise<void> => {
    await this.audioRecorderPlayer.pausePlayer();
  };

  // Aquest mètode reanuda la reproducció d'un fitxer d'àudio.
  private onResumePlay = async (): Promise<void> => {
    await this.audioRecorderPlayer.resumePlayer();
  };


  // Aquest mètode atura la reproducció d'un fitxer d'àudio i elimina el listener per a les dades de reproducció.
  private onStopPlay = async (): Promise<void> => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  };

  //Metode que renderitza per pantalla 
  public render(): ReactElement {
    let playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);

    if (!playWidth) {
      playWidth = 0;
    }
    //Fem que l'objecte retorni el contingut de la pagina principal amb components natius
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.titleTxt}>React-Native</Text>
        <View style={styles.viewPrincipal}>
        <Text style={styles.titleTxt2}>Grabadora</Text>
          <View style={styles.viewRecorderPrincipal}>
            <Text style={styles.txtRecordCounter}>{this.state.recordTime}</Text>
            <View style={styles.viewRecorder}>
              <View style={styles.recordBtnWrapper}>
              <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onStartRecord}
                  textStyle={styles.txt}>
                  Grabar
                </Button>
                <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onPauseRecord}
                  textStyle={styles.txt}>
                  Pausar
                </Button>
                <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onResumeRecord}
                  textStyle={styles.txt}>
                  Rependre
                </Button>
                <Button
                  style={[styles.btn, {marginLeft: 12}]}
                  onPress={this.onStopRecord}
                  textStyle={styles.txt}>
                  Stop
                </Button>
              </View>
            </View>
            </View>
            <Text style={styles.titleTxt2}>Reproductor</Text>
            <View style={styles.viewPlayerPrincipal}>
            <View style={styles.viewPlayer}>
              <TouchableOpacity
                style={styles.viewBarWrapper}
                onPress={this.onStatusPress}>
                <View style={styles.viewBar}>
                  <View style={[styles.viewBarPlay, {width: playWidth}]} />
                </View>
              </TouchableOpacity>
              <Text style={styles.txtCounter}>
                {this.state.playTime} / {this.state.duration}
              </Text>
              <View style={styles.playBtnWrapper}>
                <Button
                  style={styles.btn}
                  onPress={this.onStartPlay}
                  textStyle={styles.txt}>
                  Play
                </Button>
                <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onPausePlay}
                  textStyle={styles.txt}>
                  Pausar
                </Button>
                <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onResumePlay}
                  textStyle={styles.txt}>
                  Rependre
                </Button>
                <Button
                  style={[
                    styles.btn,
                    {
                      marginLeft: 12,
                    },
                  ]}
                  onPress={this.onStopPlay}
                  textStyle={styles.txt}>
                  Stop
                </Button>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.createdBy}>Isaac Gonzalez</Text>
        <Text style={styles.createdBy}>M0Uf2-IES Sabadell</Text>
      </SafeAreaView>
    );
  }
}
//Creem la fulla d'estils de tota la pagina principal
const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'column',
    alignItems: 'center',
  },
  titleTxt: {
    marginTop: 50,
    color: '#1FFAED',
    fontSize: 40,
    marginBottom:10,
    fontWeight:'bold'
  },
  titleTxt2: {
    marginTop: 20,
    color: 'black',
    fontSize: 32,
    fontWeight:'bold'
  },
  createdBy: {
    marginTop: 5,
    color: 'white',
    fontSize: 15,
  },
  viewPrincipal: {
    
    backgroundColor: '#1FFAED',
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal:20,
    marginBottom:10,
  },
  viewRecorderPrincipal: {
    marginTop: 10,
    marginBottom:0,
    paddingHorizontal:5,
    paddingVertical:20,
    backgroundColor: 'black',
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  viewPlayerPrincipal: {
    marginTop: 10,
    marginBottom:40,
    paddingHorizontal:5,
    paddingVertical:10,
    backgroundColor: 'black',
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  viewRecorder: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  recordBtnWrapper: {
    flexDirection: 'row',
  },
  viewPlayer: {
    marginTop: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: 28,
    marginHorizontal: 28,
    marginLeft:2,
    marginRight:2,
    alignSelf: 'stretch',
  },
  viewBar: {
    backgroundColor: '#ccc',
    height: 7,
    marginRight:0,
    alignSelf: 'stretch',
  },
  viewBarPlay: {
    backgroundColor: 'white',
    height: 7,
    width: 0,
    marginRight:10,
  },
  playStatusTxt: {
    marginTop: 8,
    color: '#ccc',
  },
  playBtnWrapper: {
    flexDirection: 'row',
    marginTop: 40,
  },
  btn: {
    borderColor: 'white',
    borderWidth: 5,
    borderRadius:100,
  },
  txt: {
    color: 'white',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  txtRecordCounter: {
    marginTop: 32,
    color: 'white',
    fontSize: 35,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
  txtCounter: {
    marginTop: 12,
    color: 'white',
    fontSize: 20,
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 3,
  },
});

export default Page;
