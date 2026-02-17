import React from 'react';
// internal
import { ShapeLineSm } from '@/svg';

import ErrorMsg from '@/components/common/error-msg';
import ProductSmItem from './product-sm-item';
import HomeSmPrdLoader from '@/components/loader/home/home-sm-prd-loader';
import { getProductType } from '@/redux/features/productApi';

const ProductSmArea = () => {
  // const { data: products, isError, isLoading, refetch } = useGetProductTypeQuery({type:'electronics'});
  const [products, setProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProductType('electronics');
        setProducts(result?.data || []);
      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  // decide what to render
  let content = null;

  if (isLoading) {
    content = (
      <HomeSmPrdLoader loading={isLoading} />
    );
  }
  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }
  if (!isLoading && !isError && products?.length === 0) {
    content = <ErrorMsg msg="No Products found!" />;
  }
  if (!isLoading && !isError && products?.length > 0) {
    const discount_prd = products.filter(p => p.discount > 0).slice(0, 3);
    const featured_prd = products.filter(p => p.featured).slice(0, 3);
    const selling_prd = products.data.slice().sort((a, b) => b.sellCount - a.sellCount).slice(0, 3);
    content = <div className="row">
      <div className="col-xl-4 col-md-6">
        <div className="tp-product-sm-list mb-50">
          <div className="tp-section-title-wrapper mb-40">
            <h3 className="tp-section-title tp-section-title-sm">Discount Products
              <ShapeLineSm />
            </h3>
          </div>
          <div className="tp-product-sm-wrapper mr-20">
            {discount_prd.map(item => (
              <ProductSmItem key={item._id} product={item} />
            ))}
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6">
        <div className="tp-product-sm-list mb-50">
          <div className="tp-section-title-wrapper mb-40">
            <h3 className="tp-section-title tp-section-title-sm">Featured Products
              <ShapeLineSm />
            </h3>
          </div>

          <div className="tp-product-sm-wrapper mr-20">
            {featured_prd.map(item => (
              <ProductSmItem key={item._id} product={item} />
            ))}
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6">
        <div className="tp-product-sm-list mb-50">
          <div className="tp-section-title-wrapper mb-40">
            <h3 className="tp-section-title tp-section-title-sm">Selling Products
              <ShapeLineSm />
            </h3>
          </div>

          <div className="tp-product-sm-wrapper mr-20">
            {selling_prd.map(item => (
              <ProductSmItem key={item._id} product={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  }
  return (
    <section className="tp-product-sm-area">
      <div className="container">
        {content}
      </div>
    </section>
  );
};

export default ProductSmArea;