import { StyleSheet, Text, View,PermissionsAndroid, Dimensions, Modal } from 'react-native'
import React, {useState, useEffect} from 'react'
import Mapbox from '@rnmapbox/maps'
import Geolocation from '@react-native-community/geolocation';
import Button from './Button';
import firestore from '@react-native-firebase/firestore'

const {width, height} = Dimensions.get('screen')

Mapbox.setAccessToken('MY-SECRET-KEY')

const App = () => {
    const [currentLatitude, setCurrentLatitude] = useState(0)
    const [currentLongitude, setCurrentLongitude] = useState(0)
    const [start, setStart] = useState(false)
    const [pathTraveled, setPathTraveled] = useState([]);
    const [modalVisible, setModalVisible] = useState(false)
    let intervalId;

    useEffect(()=>{
      const requestLocationPermission = async () => {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Farmstarter wants to access your location',
                message:
                  'Allow Farmstarter to access your current location',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              Geolocation.getCurrentPosition(position=>{
                setCurrentLatitude(position.coords.latitude)
                setCurrentLongitude(position.coords.longitude)
                // setInitialPosition([position.coords.longitude, position.coords.latitude])
              })
              error => console.error(error),
              { enableHighAccuracy: true, timeout: 600000, maximumAge: 0 }
            } else {
              console.log('location permission denied');
            }
          } catch (err) {
            console.warn(err);
          }
        };
        requestLocationPermission()
  },[])

  useEffect(() => {
    if (start) {
      intervalId = setInterval(() => {
        Geolocation.getCurrentPosition(position => {
          const newCoordinate = [position.coords.longitude, position.coords.latitude];
          setPathTraveled(prevPathTraveled => [...prevPathTraveled, newCoordinate]);
        });
      }, 5000);
    }
  
    return () => clearInterval(intervalId);
  }, [start]);

  
  const startWalkiing = () => {
    setStart(true);
    Geolocation.getCurrentPosition(position => {
      const newCoordinate = [position.coords.longitude, position.coords.latitude];
      setPathTraveled(prevPathTraveled => [...prevPathTraveled, newCoordinate]);
    });
  };

  const stopWalkiing = ()=>{
    setStart(false)
    clearInterval(intervalId);
    setModalVisible(true)
    console.log(pathTraveled)
    
  }

  const reset =()=>{
    if (pathTraveled.length < 2) {
      return;
    }
    setPathTraveled([]);
    Geolocation.getCurrentPosition(position => {
      setCurrentLatitude(position.coords.latitude);
      setCurrentLongitude(position.coords.longitude);
      const newCoordinate = [position.coords.longitude, position.coords.latitude];
      setPathTraveled([newCoordinate]);
    }, error => console.error(error), {
      enableHighAccuracy: true,
      timeout: 600000,
      maximumAge: 0
    });
  }

  const save = ()=>{
    let body;
    body = pathTraveled.map((coordinate)=>{
      return (
        {
          coordinate: coordinate
        }
      )
    })
    console.log(body)
    firestore().collection('coordinates').add({
      body
    }
    )
    setModalVisible(false)
    setPathTraveled([])
  }

  const dontSave =()=>{
    setModalVisible(false)
    setPathTraveled([])
      Geolocation.getCurrentPosition(position=>{
        setCurrentLatitude(position.coords.latitude)
        setCurrentLongitude(position.coords.longitude)
        
      })
      error => console.error(error),
    { enableHighAccuracy: true, timeout: 600000, maximumAge: 0 }
  }
    
 
  return (
    <View style={{...StyleSheet.absoluteFillObject}}>
      <Text style={{color: "#000"}}>{`latitude:${currentLatitude}, longitude: ${currentLongitude}`}</Text>
      <Mapbox.MapView
      style={styles.map}
      styleURL='mapbox://styles/mapbox/outdoors-v12'
      rotateEnabled={true}>
      <Mapbox.Camera 
        zoomLevel={15} centerCoordinate={[currentLongitude, currentLatitude]} pitch={60}
        animationMode='flyto' animationDuration={6000}
      />
       {
        pathTraveled.length >= 2 ?
        (<>
          <Mapbox.ShapeSource id="lineSource" shape={{
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: pathTraveled
              }
            }]
          }}>
            <Mapbox.LineLayer id="lineLayer" style={{ lineColor: '#FF0000', lineWidth: 2 }} />
          </Mapbox.ShapeSource>
          {pathTraveled.map((coordinate, index) => (
            <Mapbox.PointAnnotation 
              key={index} 
              id={`marker-${index}`} 
              coordinate={coordinate} >
                {/* <View style={{width: 50, height: 50}}>
                  <Text style={styles.marker}>{index}</Text>
                </View> */}
              </Mapbox.PointAnnotation>
          ))}
          </>
        )
        :
        (<Mapbox.PointAnnotation
      id='marker'
      coordinate={[currentLongitude, currentLatitude]}
  >
    <View style={{width: 50, height: 50}}>
            {/* <Image source={userImage} alt='dp' resizeMode='contain' style={{width: 50, height: 50}} /> */}
    </View>
  </Mapbox.PointAnnotation>)
       }
      </Mapbox.MapView>
      {
        start 
        ?
        <View style={styles.stopreset}>
          <Button handlePressed={stopWalkiing} buttontext={"Stop"} color={"#fff"} backgroundColor={"#7209B7"} height={54} borderRadius={26} width={54} justifyContent={'center'} alignItems={'center'} />
          <Button handlePressed={reset} buttontext={"Reset"} color={"#fff"} backgroundColor={"#7209B7"} marginTop={5} height={54} borderRadius={26} width={54} justifyContent={'center'} alignItems={'center'} />
        </View>
        : 
        <Button handlePressed={startWalkiing} buttontext={"Start"} position={'absolute'} zIndex={1001} right={20} bottom={100} color={"#fff"} backgroundColor={"#7209B7"} height={54} borderRadius={26} width={54} justifyContent={'center'} alignItems={'center'} />
      }
      <Modal
      animationType='slide'
      visible={modalVisible}
      transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.textModal}>Are you sure you want to save paths?</Text>
            <Text style={styles.coordinates}>
              {
                JSON.stringify(pathTraveled)
              }
            </Text>
            <View style={styles.buttons}>
              <Button handlePressed={save} buttontext={"Save"} width={'44%'} color={"#fff"} height={54} backgroundColor={"#7209B7"} justifyContent={'center'} alignItems={'center'} borderRadius={6} />
              <Button handlePressed={dontSave} buttontext={"Don\'t Save"} width={'44%'} height={54} color={"#fff"} backgroundColor={"red"} justifyContent={'center'} alignItems={'center'} borderRadius={6} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  )
}

export default App

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000
  },
  stopreset: {
    position: 'absolute',
    zIndex: 1001,
    right:20,
    bottom: 100,
    flexDirection: 'column'
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1005,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10
  },
  textModal: {
    fontSize: 16,
    color: '#000',
  },
  coordinates: {
    fontSize: 13,
    color: '#454545',
    marginTop: 10,
  },
  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  marker: {
    color: '#000',
    fontSize: 16
  }
})
