import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productsInCart = [...cart];

      const productsExist = productsInCart.find((product) => product.id === productId)

      const stockProduct = await api.get(`/stock/${productId}`)
      const stockAmount = stockProduct.data.amount

      const amountActual = productsExist ? productsExist.amount : 0;

      const amount = amountActual + 1

      if (stockAmount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productsExist) {
        productsExist.amount = amount

      } else {
        const productServer = await api.get(`/products/${productId}`)

        const data = {
          ...productServer.data,
          amount: 1
        }

        productsInCart.push(data)
      }

      setCart(productsInCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsInCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productsInCart = [...cart];

      const productsExist = productsInCart.find((product) => product.id === productId)

      if (productsExist) {
        const newProducts = productsInCart.filter((product) => {
          if (product.id !== productId) {
            return product
          }

        })

        setCart(newProducts)
        localStorage.clear()
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts))
      } else {
        toast.error('Erro na remoção do produto');
        return
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const stockProduct = await api.get(`/stock/${productId}`)
      const stockAmount = stockProduct.data.amount

      if (stockAmount < amount || amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const cartUpdated = [...cart]

      const productsMaped = cartUpdated.map((product) => {
        if (product.id === productId) {
          const data = {
            ...product,
            amount: amount
          }
          return data
        }
        return product
      })

      setCart(productsMaped)
      localStorage.clear()
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsMaped))

    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
