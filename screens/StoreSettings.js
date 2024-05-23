import {
  View,
  Button,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE, FIREBASE_AUTH } from '../FirebaseConfig';
import Colors from '../constants/colors';
import ProductItem from '../components/ProductItem';

const StoreSettings = () => {
  const navigation = useNavigation();
  const firestore = FIREBASE_FIRESTORE;
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStore();
    }, [])
  );

  const fetchStore = async () => {
    setLoading(true);
    try {
      const storeQuerySnapshot = await getDocs(
        query(
          collection(firestore, 'Store'),
          where('owner', '==', doc(firestore, `users/${user.uid}`))
        )
      );

      if (storeQuerySnapshot.empty) {
        console.log('No store found.');
        setStore(null);
        setProducts([]);
      } else {
        const storeData = storeQuerySnapshot.docs[0].data();
        storeData.id = storeQuerySnapshot.docs[0].id;
        setStore(storeData);
        fetchProducts(storeData.products);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      setStore(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (productRefs) => {
    try {
      const productFetchPromises = productRefs.map((productRef) =>
        getDoc(productRef)
      );
      const productDocuments = await Promise.all(productFetchPromises);
      const productsData = productDocuments.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  return (
    <View>
      {loading ? (
        <ActivityIndicator size='large' color='#0000ff' />
      ) : store ? (
        <View style={styles.container}>
          <Image
            style={styles.logo}
            source={{
              uri: store.logo,
            }}
          />
          <Text>Store name: {store.name}</Text>
          <Text>Store description: {store.description}</Text>
          <Text>Store category: {store.category}</Text>
          <Text>Store address: {store.address}</Text>
          <Text style={styles.titleText}>Available products</Text>
          {products && (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ProductItem product={item} />}
            />
          )}
          <Button
            onPress={() =>
              navigation.navigate('FoodPost', { storeId: store.id })
            }
            title='Create a new food item'
          />
        </View>
      ) : (
        <Text>No store information available.</Text>
      )}
    </View>
  );
};

export default StoreSettings;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: Colors.navy,
  },
  logo: {
    width: 50,
    height: 50,
  },
});