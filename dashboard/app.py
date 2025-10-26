import streamlit as st
import pandas as pd
from supabase import create_client, Client

# --- Configuración de la página ---
st.set_page_config(
    page_title="Hoom Dashboard de Propiedades",
    page_icon="🏠",
    layout="wide"
)

# --- Conexión a Supabase ---

@st.cache_resource
def init_connection() -> Client:
    url = st.secrets["supabase"]["url"]
    key = st.secrets["supabase"]["key"]
    return create_client(url, key)

supabase_client = init_connection()

# --- Lógica de Eliminación ---
if 'property_to_delete' in st.session_state and st.session_state.property_to_delete is not None:
    property_to_delete = st.session_state.property_to_delete

    @st.dialog("Confirmar eliminación")
    def confirm_delete_dialog():
        st.warning(f"¿Estás seguro de que quieres eliminar la propiedad: '{property_to_delete['title']}'?")
        col1, col2 = st.columns(2)
        if col1.button("Confirmar", use_container_width=True, type="primary"):
            try:
                supabase_client.from_("properties").delete().eq("id", property_to_delete['id']).execute()
                st.toast(f"Propiedad '{property_to_delete['title']}' eliminada.")
                st.session_state.property_to_delete = None
                st.cache_data.clear()
                st.rerun()
            except Exception as e:
                st.error(f"Error al eliminar: {e}")
        if col2.button("Cancelar", use_container_width=True):
            st.session_state.property_to_delete = None
            st.rerun()

    confirm_delete_dialog()

# --- Lógica de Edición ---
if 'property_to_edit' in st.session_state and st.session_state.property_to_edit is not None:
    property_to_edit = st.session_state.property_to_edit
    df_promoters_for_dialog = st.session_state.df_promoters_for_dialog

    @st.dialog("Editar Propiedad")
    def edit_property_dialog():
        st.subheader(f"Editando: {property_to_edit['title']}")

        promoter_options = {name: id for id, name in zip(df_promoters_for_dialog['id'], df_promoters_for_dialog['name'])}
        promoter_options["Sin Promotor"] = None
        promoter_names = list(promoter_options.keys())
        
        current_promoter_id = property_to_edit.get('promoter_id')
        current_promoter_name = next((name for name, id in promoter_options.items() if id == current_promoter_id), "Sin Promotor")
        current_promoter_index = promoter_names.index(current_promoter_name)

        with st.form("edit_form"):
            col1, col2 = st.columns(2)
            with col1:
                title = st.text_input("Título", value=property_to_edit.get('title', ''))
                price = st.number_input("Precio", value=float(property_to_edit.get('price', 0) or 0), format="%f")
                location_text = st.text_input("Ubicación", value=property_to_edit.get('location_text', ''))
                promoter_selection = st.selectbox("Promotor", options=promoter_names, index=current_promoter_index)
                construction_area_m2 = st.number_input("Construcción m²", value=int(property_to_edit.get('construction_area_m2', 0) or 0))
                land_area_m2 = st.number_input("Terreno m²", value=int(property_to_edit.get('land_area_m2', 0) or 0))

            with col2:
                bedrooms = st.number_input("Recámaras", value=int(property_to_edit.get('bedrooms', 0) or 0))
                full_bathrooms = st.number_input("Baños completos", value=int(property_to_edit.get('full_bathrooms', 0) or 0))
                half_bathrooms = st.number_input("Medios Baños", value=int(property_to_edit.get('half_bathrooms', 0) or 0))
                parking_spaces = st.number_input("Estacionamientos", value=int(property_to_edit.get('parking_spaces', 0) or 0))
                levels = st.number_input("Niveles", value=int(property_to_edit.get('levels', 0) or 0))
            
            description = st.text_area("Descripción", value=property_to_edit.get('description', ''))

            if st.form_submit_button("Guardar Cambios", use_container_width=True, type="primary"):
                updated_data = {
                    'title': title, 'price': price, 'location_text': location_text,
                    'description': description, 'construction_area_m2': construction_area_m2,
                    'land_area_m2': land_area_m2, 'bedrooms': bedrooms, 'full_bathrooms': full_bathrooms,
                    'half_bathrooms': half_bathrooms, 'parking_spaces': parking_spaces, 'levels': levels,
                    'promoter_id': promoter_options[promoter_selection]
                }
                try:
                    supabase_client.from_("properties").update(updated_data).eq("id", property_to_edit['id']).execute()
                    st.toast("Propiedad actualizada con éxito.")
                    st.session_state.property_to_edit = None
                    st.cache_data.clear()
                    st.rerun()
                except Exception as e:
                    st.error(f"Error al actualizar: {e}")

        if st.button("Cancelar"):
            st.session_state.property_to_edit = None
            st.rerun()

    edit_property_dialog()

# --- Carga de Datos ---
@st.cache_data(ttl=600)
def load_data():
    # Cargar propiedades
    properties_response = supabase_client.from_("properties").select("*, promoter_id(*)").execute()
    if not properties_response.data:
        return pd.DataFrame(), pd.DataFrame()
    
    df_properties = pd.DataFrame(properties_response.data)
    
    # Procesar datos de propiedades
    df_properties['created_at'] = pd.to_datetime(df_properties['created_at']).dt.date
    df_properties['price'] = pd.to_numeric(df_properties['price'], errors='coerce')
    df_properties['source_portal'] = df_properties['source_portal'].fillna('Desconocido')
    df_properties['latitude'] = pd.to_numeric(df_properties['latitude'], errors='coerce')
    df_properties['longitude'] = pd.to_numeric(df_properties['longitude'], errors='coerce')

    # Extraer y aplanar datos del promotor
    def get_promoter_name(promoter_data):
        if isinstance(promoter_data, dict) and 'name' in promoter_data:
            return promoter_data['name']
        return "Sin Promotor"

    df_properties['promoter_name'] = df_properties['promoter_id'].apply(get_promoter_name)
    df_properties['promoter_id'] = df_properties['promoter_id'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)

    # Cargar todos los promotores para el filtro
    promoters_response = supabase_client.from_("promoters").select("id, name").execute()
    df_promoters = pd.DataFrame(promoters_response.data) if promoters_response.data else pd.DataFrame(columns=['id', 'name'])
    
    return df_properties, df_promoters

# --- UI de la Aplicación ---
st.title("🏠 Dashboard de Propiedades")

df_properties, df_promoters = load_data()

if df_properties.empty:
    st.warning("No se encontraron propiedades en la base de datos. ¡Empieza a capturar con la extensión!")
else:
    st.header("Filtros")
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        # Filtro por portal
        portals = df_properties['source_portal'].unique()
        selected_portal = st.multiselect("Portal de Origen", options=portals, default=portals)

    with col2:
        # Filtro por promotor
        promoter_list = pd.concat([pd.DataFrame([{'name': 'Sin Promotor'}]), df_promoters[['name']]], ignore_index=True)
        selected_promoters = st.multiselect("Promotor", options=promoter_list['name'].unique(), default=promoter_list['name'].unique())
    
    with col3:
        # Filtro por tipo de propiedad
        property_types = ['Todos'] + sorted(df_properties['property_type'].dropna().unique().tolist())
        selected_property_type = st.selectbox("Tipo de Propiedad", options=property_types, index=0)
        
    with col4:
        # Filtro para excluir fraccionamientos
        exclude_fraccionamientos = st.checkbox("Excluir Fraccionamientos", value=True)
    
    # Filtro por rango de precio (debajo de las otras columnas)
    min_price, max_price = st.slider(
        "Rango de Precio (MXN)",
        min_value=0,
        max_value=int(df_properties['price'].max() or 0),
        value=(0, int(df_properties['price'].max() or 0))
    )

    if st.button("🔄 Recargar Datos"):
        st.cache_data.clear()
        st.rerun()

    # Aplicar filtros
    filtered_df = df_properties[
        (df_properties['source_portal'].isin(selected_portal)) &
        (df_properties['promoter_name'].isin(selected_promoters)) &
        (df_properties['price'] >= min_price) &
        (df_properties['price'] <= max_price) &
        ((selected_property_type == 'Todos') | (df_properties['property_type'] == selected_property_type)) &
        (~df_properties['title'].str.contains('fraccionamiento', case=False, na=False) | ~exclude_fraccionamientos)
    ]

    st.header(f"Propiedades Encontradas: {len(filtered_df)}")
    st.markdown("---")

    # --- Vista de Tarjetas ---
    for _, row in filtered_df.iterrows():
        with st.container(border=True):
            col1, col2 = st.columns([1, 2])

            with col1:
                # Foto principal
                if row['photos'] and len(row['photos']) > 0:
                    st.image(row['photos'][0], use_container_width=True)
                else:
                    # Placeholder si no hay foto
                    st.image("https://via.placeholder.com/400x300.png?text=Sin+Foto", use_container_width=True)

            with col2:
                # --- Título y Precio ---
                title_col, price_col = st.columns([3, 1])
                with title_col:
                    st.subheader(row['title'] or "Sin Título")
                with price_col:
                    price_str = f"${row['price']:,.0f}" if pd.notna(row['price']) else "N/A"
                    st.markdown(f"<h3 style='text-align: right; color: #28a745;'>{price_str}</h3>", unsafe_allow_html=True)

                # --- Ubicación y Promotor ---
                st.markdown(f"**📍 {row['location_text'] or 'Ubicación no especificada'}**")
                st.markdown(f"**👤 Promotor:** {row['promoter_name']}")

                # --- Métricas Compactas ---
                def create_metric_string(value, unit):
                    # Helper to format metric strings, handling None, NaN, or 0 values
                    return f"{int(value)} {unit}" if pd.notna(value) and value != 0 else "N/A"

                # First row of metrics
                metrics_col1, metrics_col2, metrics_col3, metrics_col4 = st.columns(4)
                metrics_col1.markdown(f"**Constr:**<br>{create_metric_string(row.get('construction_area_m2'), 'm²')}", unsafe_allow_html=True)
                metrics_col2.markdown(f"**Terreno:**<br>{create_metric_string(row.get('land_area_m2'), 'm²')}", unsafe_allow_html=True)
                metrics_col3.markdown(f"**Recámaras:**<br>{create_metric_string(row.get('bedrooms'), '🛏️')}", unsafe_allow_html=True)
                metrics_col4.markdown(f"**Niveles:**<br>{create_metric_string(row.get('levels'), '🏢')}", unsafe_allow_html=True)

                # Second row of metrics
                metrics_col5, metrics_col6, metrics_col7, _ = st.columns(4) # Use a throwaway for alignment
                metrics_col5.markdown(f"**Baños:**<br>{create_metric_string(row.get('full_bathrooms'), '🚽')}", unsafe_allow_html=True)
                metrics_col6.markdown(f"**1/2 Baños:**<br>{create_metric_string(row.get('half_bathrooms'), '🚻')}", unsafe_allow_html=True)
                metrics_col7.markdown(f"**Estac:**<br>{create_metric_string(row.get('parking_spaces'), '🚗')}", unsafe_allow_html=True)

                # --- Botones de Acción ---
                action_col1, action_col2, action_col3 = st.columns(3)
                action_col1.link_button("Ver Anuncio", row['property_url'], use_container_width=True)
                if action_col2.button("✏️ Editar", key=f"edit_{row['id']}", use_container_width=True):
                    st.session_state.property_to_edit = row.to_dict()
                    st.session_state.df_promoters_for_dialog = df_promoters # Guardar promotores para el diálogo
                    st.rerun()
                if action_col3.button("🗑️ Eliminar", key=f"delete_{row['id']}", use_container_width=True):
                    st.session_state.property_to_delete = row

            # Expander para más detalles y galería
            with st.expander("Ver más detalles y galería de fotos"):
                st.markdown("**Descripción**")
                st.write(row['description'] or "Sin descripción.")
                # Mostrar niveles si existe el dato
                if pd.notna(row['levels']) and row['levels'] > 0:
                    st.markdown("**Características adicionales**")
                    st.metric("Niveles", int(row['levels']))

                # Mapa de ubicación
                if pd.notna(row['latitude']) and pd.notna(row['longitude']):
                    st.markdown("**Ubicación en el Mapa**")
                    map_df = pd.DataFrame({'lat': [row['latitude']], 'lon': [row['longitude']]})
                    st.map(map_df, zoom=14)

                # Galería de fotos con opción de seleccionar principal
                if row['photos'] and len(row['photos']) > 1:
                    st.markdown("**Galería**")
                    # Crear una cuadrícula para la galería
                    cols = st.columns(4)
                    for i, photo_url in enumerate(row['photos']):
                        col_index = i % 4
                        with cols[col_index]:
                            st.image(photo_url, use_container_width=True)
                            # No mostrar el botón para la imagen que ya es principal
                            if i > 0:
                                if st.button("Establecer como principal", key=f"set_main_{row['id']}_{i}", use_container_width=True):
                                    # Reordenar la lista de fotos
                                    new_photos_order = [photo_url] + [p for p in row['photos'] if p != photo_url]
                                    try:
                                        # Actualizar en Supabase
                                        supabase_client.from_("properties").update({"photos": new_photos_order}).eq("id", row['id']).execute()
                                        st.toast("Imagen principal actualizada.")
                                        st.cache_data.clear()
                                        st.rerun()
                                    except Exception as e:
                                        st.error(f"Error al actualizar: {e}")
