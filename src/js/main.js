import { loadHeaderFooter } from './utils.mjs';
import ProductData from './ProductData.mjs';
import ProductList from './ProductList.mjs';
import Alert from './Alert.js';

loadHeaderFooter();

const siteAlert = new Alert();
siteAlert.init();

const category = 'tents';
const dataSource = new ProductData(category);
const listElement = document.querySelector('.product-list');

const myList = new ProductList(category, dataSource, listElement);
myList.init();
