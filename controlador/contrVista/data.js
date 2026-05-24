import { supabase } from '../../modelo/supabase.js';

let allProducts = []; // Para almacenar los productos una vez que se cargan
let allBrands = [];   // Para almacenar las marcas una vez que se cargan

/**
 * Recupera la lista de productos desde Supabase.
 * Realiza un join con las tablas 'marca' y 'categoria' para obtener los nombres.
 * @returns {Promise<Array>} Un array de objetos de producto.
 */
export async function getProducts() {
  if (allProducts.length > 0) {
    return allProducts;
  }

  // Intentar recuperar de caché de sesión para evitar peticiones repetidas a la DB
  const cached = sessionStorage.getItem('bb_products_cache');
  if (cached) {
    allProducts = JSON.parse(cached);
    return allProducts;
  }

  let query = supabase.from('producto').select(`
      prd_codigo,
      prd_descripcion,
      prd_precio_venta,
      prd_precio_ven_ant,
      prd_stock_min,
      prd_url,
      unm_codigo,
      prd_tipo_piel,
      marca (mar_codigo, mar_nombre),
      categoria (cat_codigo, cat_descripcion)
    `);

  const { data, error } = await query;

  if (error) {
    console.error('Mensaje de Supabase:', error.message);
    console.error('Sugerencia:', error.hint);
    return []; // Devolvemos un array vacío para que .map() en otros archivos no falle
  }

  // Mapeamos los datos de Supabase al formato esperado por la aplicación
  const mapped = data.map(mapProduct);
  allProducts = mapped;
  
  // Guardar en caché de sesión
  sessionStorage.setItem('bb_products_cache', JSON.stringify(mapped));

  return mapped;
}

/**
 * Helper para mapear un objeto de producto de Supabase al formato de la App
 */
function mapProduct(p) {
  return {
    id: p.prd_codigo,
    name: p.prd_descripcion,
    brandCode: p.marca ? p.marca.mar_codigo : null,
    brand: p.marca ? p.marca.mar_nombre : 'Desconocida', 
    catCode: p.categoria ? p.categoria.cat_codigo : null,
    category: p.categoria ? p.categoria.cat_descripcion : 'General', 
    problem: 'general', 
    skinType: p.prd_tipo_piel ? p.prd_tipo_piel.trim() : 'TODOS', 
    unitCode: p.unm_codigo,
    price: p.prd_precio_venta,
    oldPrice: (p.prd_precio_ven_ant && p.prd_precio_ven_ant > p.prd_precio_venta) ? p.prd_precio_ven_ant : null,
    onSale: (p.prd_precio_ven_ant && p.prd_precio_ven_ant > p.prd_precio_venta),
    stock: p.prd_stock_min,
    img: p.prd_url,
    description: p.prd_descripcion,
    includesIVA: true // Asumimos que todos los productos incluyen IVA por defecto
  };
}

/**
 * Recupera un único producto por su ID de forma eficiente.
 */
export async function getProductById(id) {
  // 1. Buscar en caché primero
  const products = await getProducts();
  const found = products.find(p => String(p.id) === String(id));
  if (found) return found;

  // 2. Si no está en caché, pedir solo este ID a la DB
  const { data, error } = await supabase
    .from('producto')
    .select(`
      prd_codigo,
      prd_descripcion,
      prd_precio_venta,
      prd_precio_ven_ant,
      prd_stock_min,
      prd_url,
      unm_codigo,
      prd_tipo_piel,
      marca (mar_codigo, mar_nombre),
      categoria (cat_codigo, cat_descripcion)
    `)
    .eq('prd_codigo', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data);
}

/**
 * Recupera la lista de marcas desde Supabase.
 * @returns {Promise<Array>} Un array de objetos de marca.
 */
export async function getBrands() {
  if (allBrands.length > 0) {
    return allBrands;
  }

  const cached = sessionStorage.getItem('bb_brands_cache');
  if (cached) {
    allBrands = JSON.parse(cached);
    return allBrands;
  }

  const { data, error } = await supabase
    .from('marca')
    .select('mar_nombre, mar_url');

  if (error) {
    console.error('Error al obtener marcas de Supabase:', error.message);
    return [];
  }

  allBrands = data;
  sessionStorage.setItem('bb_brands_cache', JSON.stringify(data));
  return allBrands;
}

/**
 * Obtiene el perfil completo del cliente desde Supabase
 * @param {string} identifier - El nombre de usuario (ura_usuario) o correo electrónico
 */
export async function getClientProfile(identifier) {
  if (!identifier) return null;

  // Intentar primero por nombre de usuario
  let { data, error } = await supabase
    .from('usuario_a')
    .select(`
      ura_usuario,
      cliente (
        cli_ci_ruc, cli_nombre, cli_apellido, cli_telefono, cli_correo
      )
    `)
    .eq('ura_usuario', identifier)
    .maybeSingle();

  // Si no se encuentra, intentar por correo electrónico (vía join con cliente)
  if (!data && !error) {
    const { data: byEmail, error: emailError } = await supabase
      .from('usuario_a')
      .select(`
        ura_usuario,
        cliente!inner (
          cli_ci_ruc, cli_nombre, cli_apellido, cli_telefono, cli_correo
        )
      `)
      .eq('cliente.cli_correo', identifier)
      .maybeSingle();
    
    if (!emailError) data = byEmail;
  }

  if (error && error.code !== 'PGRST116') {
    console.error('Error al obtener perfil:', error.message);
    return null;
  }
  return data;
}

/**
 * Verifica las credenciales del usuario en Supabase (Login)
 */
export async function signIn(username, password) {
  const { data, error } = await supabase
    .from('usuario_a')
    .select(`
      ura_usuario,
      cliente (
        cli_nombre,
        cli_correo
      )
    `)
    .eq('ura_usuario', username)
    .eq('ura_clave', password)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Registra un nuevo cliente y su usuario en Supabase (Registro)
 */
export async function signUp(clientData, userData) {
  // 1. Crear el registro en la tabla cliente
  const { error: errCli } = await supabase
    .from('cliente')
    .insert([clientData]);

  if (errCli) throw errCli;

  // 2. Crear las credenciales en la tabla usuario_a
  const { error: errUsr } = await supabase
    .from('usuario_a')
    .insert([userData]);

  if (errUsr) throw errUsr;
  return true;
}

/**
 * Actualiza la contraseña de un usuario en Supabase basándose en su correo electrónico
 */
export async function updatePasswordByEmail(email, newPassword) {
  // 1. Obtener la cédula del cliente usando el correo
  const { data: client, error: clientErr } = await supabase
    .from('cliente')
    .select('cli_ci_ruc')
    .eq('cli_correo', email)
    .single();

  if (clientErr || !client) throw new Error("Correo no registrado.");

  // 2. Actualizar la clave en la tabla de usuarios usando la cédula (vínculo)
  const { error: userErr } = await supabase
    .from('usuario_a')
    .update({ ura_clave: newPassword })
    .eq('cli_ci_ruc', client.cli_ci_ruc);

  if (userErr) throw userErr;
  return true;
}

/**
 * Verifica si un correo electrónico existe en la base de datos
 */
export async function checkEmailExists(email) {
  const { data } = await supabase
    .from('cliente')
    .select('cli_correo')
    .eq('cli_correo', email)
    .maybeSingle();
  return !!data;
}

/* ============== FAVORITOS (Supabase) ============== */

export async function getFavoritesDB(username) {
  if (!username) return [];
  const { data, error } = await supabase
    .from('favorito')
    .select('prd_codigo')
    .eq('ura_usuario', username);
  
  if (error || !data) return [];
  return data.map(f => String(f.prd_codigo).trim());
}

export async function addFavoriteDB(username, productId) {
  const cleanId = String(productId).trim();
  const { error } = await supabase
    .from('favorito')
    .insert([{ ura_usuario: username, prd_codigo: cleanId }]);
  
  if (error) {
    console.error("--- ERROR EN SUPABASE (Añadir Favorito) ---");
    console.error("Mensaje:", error.message);
    console.error("Detalles:", error.details);
    console.error("Código de error:", error.code);
  }
  return !error;
}

export async function removeFavoriteDB(username, productId) {
  const cleanId = String(productId).trim();
  const { error } = await supabase
    .from('favorito')
    .delete()
    .eq('ura_usuario', username)
    .eq('prd_codigo', cleanId);

  if (error) {
    console.error("--- ERROR EN SUPABASE (Eliminar Favorito) ---");
    console.error("Mensaje:", error.message);
    console.error("Detalles:", error.details);
    console.error("Código de error:", error.code);
  }
  return !error;
}

/**
 * Obtiene las reseñas escritas por un usuario específico.
 */
export async function getReviewsByUser(username) {
  if (!username) return [];

  const { data, error } = await supabase
    .from('resenia')
    .select(`
      res_comentario,
      res_calificacion,
      prd_producto,
      producto (prd_descripcion)
    `)
    .eq('ura_usuario', username);

  if (error || !data) {
    console.error('Error al obtener reseñas del usuario:', error?.message);
    return [];
  }
  
  return data.map(r => ({
    productId: r.prd_producto,
    productName: r.producto?.prd_descripcion || 'Producto Desconocido',
    stars: r.res_calificacion,
    text: r.res_comentario
  }));
}

/* ============== RESEÑAS (Supabase) ============== */

/**
 * Obtiene las reseñas de un producto desde la tabla 'resenia'
 */
export async function getReviews(productId) {
  const { data, error } = await supabase
    .from('resenia')
    .select(`
      res_comentario,
      res_calificacion,
      usuario_a (
        cliente (cli_nombre)
      )
    `)
    .eq('prd_producto', productId);

  if (error) return [];
  return data.map(r => ({
    name: r.usuario_a?.cliente?.cli_nombre || 'Usuario',
    stars: r.res_calificacion,
    text: r.res_comentario
  }));
}

/**
 * Guarda una nueva reseña en la base de datos
 */
export async function saveReview(productId, username, stars, text) {
  const { error } = await supabase
    .from('resenia')
    .insert([{ 
      prd_producto: productId, 
      ura_usuario: username, 
      res_calificacion: stars, 
      res_comentario: text 
    }]);
  return !error;
}
/**
 * Obtiene el carrito guardado en la DB para un usuario
 */
export async function getCartDB(username) {
  const { data, error } = await supabase
    .from('carrito') // Asumiendo que creas esta tabla
    .select('prd_codigo, car_cantidad')
    .eq('ura_usuario', username);

  if (error) return [];
  return data.map(item => ({ id: item.prd_codigo, qty: item.car_cantidad }));
}

/**
 * Guarda el estado actual del carrito en la DB (Sincronización)
 */
export async function syncCartDB(username, cartItems) {
  // Primero eliminamos el carrito anterior para evitar duplicados
  await supabase.from('carrito').delete().eq('ura_usuario', username);

  if (cartItems.length === 0) return true;

  const toInsert = cartItems.map(item => ({ ura_usuario: username, prd_codigo: item.id, car_cantidad: item.qty }));
  const { error } = await supabase.from('carrito').insert(toInsert);
  return !error;
}

/**
 * Obtiene la lista de sucursales desde Supabase
 */
export async function getBranches() {
  const { data, error } = await supabase
    .from('sucursal')
    .select('suc_codigo, ciu_codigo, suc_nombre, suc_direccion')
    .order('suc_nombre', { ascending: true });
  
  if (error) console.error('Error al obtener sucursales:', error.message);
  return error ? [] : data;
}

/* ============== GEOGRAFÍA (Supabase) ============== */

/**
 * Obtiene la lista de todas las provincias
 */
export async function getProvinces() {
  const { data, error } = await supabase
    .from('provincia')
    .select('pro_codigo, pro_descripcion')
    .order('pro_descripcion', { ascending: true });
  return error ? [] : data;
}

/**
 * Obtiene las ciudades filtradas por código de provincia
 */
export async function getCitiesByProvince(pro_codigo) {
  const { data, error } = await supabase
    .from('ciudad')
    .select('ciu_codigo, ciu_nombre')
    .eq('pro_codigo', pro_codigo)
    .order('ciu_nombre', { ascending: true });
  return error ? [] : data;
}

/**
 * Actualiza el stock de un producto restando la cantidad comprada
 */
export async function updateProductStock(productId, quantityPurchased) {
  const { data: p } = await supabase
    .from('producto')
    .select('prd_stock_min')
    .eq('prd_codigo', productId)
    .single();

  if (!p) throw new Error(`Producto ${productId} no encontrado para actualizar stock.`);
  const newStock = Math.max(0, p.prd_stock_min - quantityPurchased);

  allProducts = []; // Limpiar cache para forzar recarga
  const { error } = await supabase.from('producto').update({ prd_stock_min: newStock }).eq('prd_codigo', productId);
  if (error) throw error;
  return true;
}

/**
 * Crea un pedido completo con sus detalles y factura en Supabase
 */
export async function createOrderDB(orderData, items, authData = null) {
  // 1. Insertar el pedido principal
  const { data: pedido, error: errPed } = await supabase
    .from('pedidos')
    .insert([orderData])
    .select()
    .single();

  if (errPed) throw errPed;

  // Si se proporcionaron datos de autorización para el retiro
  if (authData) {
    const { error: errAuth } = await supabase
      .from('autorizacion_retiro')
      .insert([{ ...authData, ped_codigo: pedido.ped_codigo }]);
    if (errAuth) throw errAuth;
  }

  // 2. Insertar los detalles del pedido
  const details = items.map(item => ({
    ped_codigo: pedido.ped_codigo, // ID generado por Supabase
    prd_codigo: String(item.id),
    det_cantidad: parseInt(item.qty),
    det_precio_unitario: parseFloat(item.price)
  }));

  const { error: errDet } = await supabase.from('detalle_pedido').insert(details);
  if (errDet) throw errDet;

  // 3. Generar la factura asociada
  const { error: errFac } = await supabase.from('factura').insert([{
    ped_codigo: pedido.ped_codigo,
    fac_fecha: new Date().toISOString(),
    fac_total: orderData.ped_total,
    fac_iva: orderData.ped_total * 0.12 // Asumiendo IVA 12%
  }]);

  if (errFac) throw errFac;
  return pedido;
}

/**
 * Obtiene el historial de pedidos de un usuario
 */
export async function getUserOrders(username) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      ped_codigo, ped_total, created_at, cli_ci_ruc,
      estado_pedido (est_codigo, est_descripcion)
    `)
    .eq('cli_ci_ruc', username)
    .order('created_at', { ascending: false }); // Ahora sí podemos ordenar por ella

  return error ? [] : data;
}

/**
 * Obtiene todos los pedidos registrados en el sistema (Admin)
 */
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      ped_codigo, ped_total, created_at, cli_ci_ruc,
      estado_pedido (est_codigo, est_descripcion)
    `)
    .order('created_at', { ascending: false });

  return error ? [] : data;
}

/**
 * Actualiza el estado de un pedido (Admin)
 */
export async function updateOrderStatus(orderId, newStatusId) {
  const { error } = await supabase
    .from('pedidos')
    .update({ est_codigo: parseInt(newStatusId) })
    .eq('ped_codigo', orderId);
  return !error;
}

/**
 * Aumenta el stock de un producto (Admin)
 */
export async function increaseProductStock(productId, amountToAdd) {
  const { data: p } = await supabase
    .from('producto')
    .select('prd_stock_min')
    .eq('prd_codigo', productId)
    .single();

  if (!p) return false;
  const newStock = (p.prd_stock_min || 0) + parseInt(amountToAdd);

  allProducts = []; // Limpiar cache
  const { error } = await supabase.from('producto').update({ prd_stock_min: newStock }).eq('prd_codigo', productId);
  return !error;
}

/**
 * Actualiza los datos personales del cliente en Supabase
 */
export async function updateClientProfile(ci, updateData) {
  const { error } = await supabase
    .from('cliente')
    .update(updateData)
    .eq('cli_ci_ruc', ci);
  return !error;
}
