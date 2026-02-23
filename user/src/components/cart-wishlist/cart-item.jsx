import React from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import Link from "next/link";
// internal
import { Close, Minus, Plus } from "@/svg";
import {
  add_cart_product,
  quantityDecrement,
  remove_product,
} from "@/redux/features/cartSlice";

const CartItem = ({ product }) => {
  const {
    _id,
    img,
    title,
    price,
    orderQuantity = 0,
    selected_size,
    selected_color,
  } = product || {};

  const dispatch = useDispatch();

  // handle add product
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };
  // handle decrement product
  const handleDecrement = (prd) => {
    dispatch(quantityDecrement(prd));
  };

  // handle remove product
  const handleRemovePrd = (prd) => {
    dispatch(remove_product(prd));
  };

  return (
    <tr>
      {/* img */}
      <td className="tp-cart-img">
        <Link href={`/product-details/${_id}`}>
          <Image src={img} alt="product img" width={70} height={100} />
        </Link>
      </td>
      {/* title */}
      <td className="tp-cart-title">
        <Link href={`/product-details/${_id}`}>{title}</Link>
        <div
          className="tp-cart-variants"
          style={{
            fontSize: "13px",
            color: "#777",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {selected_color && (
            <span style={{ display: "flex", alignItems: "center" }}>
              Color:{" "}
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: selected_color,
                  border: "1px solid #ccc",
                  marginLeft: "4px",
                }}
              ></span>
            </span>
          )}
          {selected_color && selected_size && <span> | </span>}
          {selected_size && <span>Size: {selected_size}</span>}
        </div>
      </td>
      {/* price */}
      <td className="tp-cart-price">
        <span>${(price * orderQuantity).toFixed(2)}</span>
      </td>
      {/* quantity */}
      <td className="tp-cart-quantity">
        <div className="tp-product-quantity mt-10 mb-10">
          <span
            onClick={() => handleDecrement(product)}
            className="tp-cart-minus"
          >
            <Minus />
          </span>
          <input
            className="tp-cart-input"
            type="text"
            value={orderQuantity}
            readOnly
          />
          <span
            onClick={() => handleAddProduct(product)}
            className="tp-cart-plus"
          >
            <Plus />
          </span>
        </div>
        {product.quantity ? (
          <div
            style={{
              fontSize: "12px",
              color: "#777",
              textAlign: "center",
              marginTop: "-4px",
              marginBottom: "8px",
            }}
          >
            Available: {product.quantity}
          </div>
        ) : null}
      </td>
      {/* action */}
      <td className="tp-cart-action">
        <button
          onClick={() => handleRemovePrd({ ...product, id: product._id })}
          className="tp-cart-action-btn"
        >
          <Close />
          <span> Remove</span>
        </button>
      </td>
    </tr>
  );
};

export default CartItem;
