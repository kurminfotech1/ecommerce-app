const menu_data = [
  {
    id: 1,
    single_link: true,
    title: "Home",
    link: "/",
  },
  {
    id: 2,
    products: true,
    title: "Products",
    link: "/shop",
    product_pages: [
      {
        title: "Catalog",
        link: "/shop",
        mega_menus: [
          { title: "Products", link: "/shop" },
          { title: "Categories", link: "/shop-category" },
        ],
      },
      {
        title: "eCommerce",
        link: "/cart",
        mega_menus: [
          { title: "Cart", link: "/cart" },
          { title: "Wishlist", link: "/wishlist" },
          { title: "Orders", link: "/profile" },
        ],
      },
      {
        title: "Account",
        link: "/profile",
        mega_menus: [
          { title: "User Profile", link: "/profile" },
          { title: "Checkout", link: "/checkout" },
        ],
      },
    ],
  },
  {
    id: 3,
    sub_menu: true,
    title: "Shop",
    link: "/shop",
    sub_menus: [
      { title: "Products", link: "/shop" },
      { title: "Categories", link: "/shop-category" },
      { title: "Cart", link: "/cart" },
      { title: "Orders", link: "/profile" },
      { title: "Wishlist", link: "/wishlist" },
      { title: "Checkout", link: "/checkout" },
    ],
  },
  {
    id: 4,
    single_link: true,
    title: "Coupons",
    link: "/coupon",
  },
  {
    id: 5,
    sub_menu: true,
    title: "Blog",
    link: "/blog",
    sub_menus: [
      { title: "Blog Standard", link: "/blog" },
      { title: "Blog Grid", link: "/blog-grid" },
      { title: "Blog List", link: "/blog-list" },
      { title: "Blog Details", link: "/blog-details" },
      { title: "Blog Details Full Width", link: "/blog-details-2" },
    ],
  },
  {
    id: 6,
    single_link: true,
    title: "Contact",
    link: "/contact",
  },
];

export default menu_data;

// mobile_menu
export const mobile_menu = [
  {
    id: 1,
    single_link: true,
    title: "Home",
    link: "/",
  },
  {
    id: 2,
    sub_menu: true,
    title: "Products",
    link: "/shop",
    sub_menus: [
      { title: "Products", link: "/shop" },
      { title: "Categories", link: "/shop-category" },
      { title: "Cart", link: "/cart" },
      { title: "Orders", link: "/profile" },
      { title: "Wishlist", link: "/wishlist" },
      { title: "User Profile", link: "/profile" },
    ],
  },
  {
    id: 3,
    sub_menu: true,
    title: "Shop",
    link: "/shop",
    sub_menus: [
      { title: "Products", link: "/shop" },
      { title: "Categories", link: "/shop-category" },
      { title: "Cart", link: "/cart" },
      { title: "Orders", link: "/profile" },
      { title: "Wishlist", link: "/wishlist" },
      { title: "Checkout", link: "/checkout" },
    ],
  },
  {
    id: 4,
    single_link: true,
    title: "Coupons",
    link: "/coupon",
  },
  {
    id: 5,
    sub_menu: true,
    title: "Blog",
    link: "/blog",
    sub_menus: [
      { title: "Blog Standard", link: "/blog" },
      { title: "Blog Grid", link: "/blog-grid" },
      { title: "Blog List", link: "/blog-list" },
      { title: "Blog Details", link: "/blog-details" },
      { title: "Blog Details Full Width", link: "/blog-details-2" },
    ],
  },
  {
    id: 6,
    single_link: true,
    title: "Contact",
    link: "/contact",
  },
];
