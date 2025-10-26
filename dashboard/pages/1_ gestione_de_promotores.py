import streamlit as st
import pandas as pd
from supabase import create_client, Client

# --- Configuración de la página ---
st.set_page_config(
    page_title="Gestión de Promotores",
    page_icon="👥",
    layout="wide"
)

# --- Conexión a Supabase ---
@st.cache_resource
def init_connection() -> Client:
    url = st.secrets["supabase"]["url"]
    key = st.secrets["supabase"]["key"]
    return create_client(url, key)

supabase_client = init_connection()

# --- Carga de Datos ---
@st.cache_data(ttl=60)
def load_promoters():
    # Cargar promotores con sus propiedades
    response = supabase_client.from_("promoters").select("*, properties(id, title, price, location_text, property_type)").execute()
    if response.data:
        return pd.DataFrame(response.data)
    return pd.DataFrame()

@st.cache_data(ttl=60)
def load_properties():
    response = supabase_client.from_("properties").select("id, title, promoter_id").execute()
    if response.data:
        return pd.DataFrame(response.data)
    return pd.DataFrame()

# --- UI de la Aplicación ---
st.title("👥 Gestión de Promotores")

df_promoters = load_promoters()

# --- Formulario para Añadir/Editar Promotor ---
st.header("Añadir o Editar Promotor")

# Usar el estado de la sesión para mantener los datos del formulario
if 'selected_promoter' not in st.session_state:
    st.session_state.selected_promoter = None

if st.session_state.selected_promoter is not None:
    promoter = st.session_state.selected_promoter
    name = promoter.get('name', '')
    company = promoter.get('company', '')
    phone = promoter.get('phone', '')
    email = promoter.get('email', '')
    promoter_id = promoter.get('id')
else:
    name, company, phone, email, promoter_id = "", "", "", "", None

with st.form(key="promoter_form", clear_on_submit=True):
    name = st.text_input("Nombre", value=name)
    company = st.text_input("Empresa", value=company)
    phone = st.text_input("Teléfono", value=phone)
    email = st.text_input("Email", value=email)
    
    submitted = st.form_submit_button("Guardar Promotor")
    if submitted:
        if name:
            promoter_data = {"name": name, "company": company, "phone": phone, "email": email}
            try:
                if promoter_id:
                    supabase_client.from_("promoters").update(promoter_data).eq("id", promoter_id).execute()
                    st.toast(f"Promotor '{name}' actualizado con éxito.")
                else:
                    supabase_client.from_("promoters").insert(promoter_data).execute()
                    st.toast(f"Promotor '{name}' añadido con éxito.")
                
                st.session_state.selected_promoter = None
                st.cache_data.clear()
                st.rerun()
            except Exception as e:
                st.error(f"Error al guardar: {e}")
        else:
            st.warning("El nombre del promotor es obligatorio.")

if st.session_state.selected_promoter:
    if st.button("Cancelar Edición"):
        st.session_state.selected_promoter = None
        st.rerun()

st.markdown("---")

# --- Tabla de Promotores ---
st.header("Promotores Existentes")
if not df_promoters.empty:
    # Mostrar lista de promotores con propiedades
    for _, promoter in df_promoters.iterrows():
        with st.expander(f"{promoter['name']} - {promoter['company'] or 'Sin empresa'}"):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"**Teléfono:** {promoter.get('phone', 'No especificado')}")
                st.write(f"**Email:** {promoter.get('email', 'No especificado')}")
            
            with col2:
                if st.button(f"✏️ Editar", key=f"edit_{promoter['id']}"):
                    st.session_state.selected_promoter = promoter.to_dict()
                    st.rerun()
                
                if st.button(f"🗑️ Eliminar", key=f"delete_{promoter['id']}"):
                    try:
                        supabase_client.from_("promoters").delete().eq("id", promoter['id']).execute()
                        st.toast(f"Promotor '{promoter['name']}' eliminado.")
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error al eliminar: {e}")
            
            # Mostrar propiedades del promotor
            if promoter.get('properties'):
                st.subheader("Propiedades")
                properties_df = pd.DataFrame(promoter['properties'])
                st.dataframe(
                    properties_df[['title', 'price', 'location_text', 'property_type']],
                    use_container_width=True,
                    column_config={
                        'title': 'Título',
                        'price': st.column_config.NumberColumn('Precio', format="$%.0f"),
                        'location_text': 'Ubicación',
                        'property_type': 'Tipo'
                    },
                    hide_index=True
                )
            else:
                st.info("Este promotor no tiene propiedades asignadas.")
            
            st.write("---")

# Selector para edición/eliminación
st.subheader("Gestión Rápida")
if not df_promoters.empty:
    selected_id = st.selectbox(
        "Selecciona un promotor para editar o eliminar",
        options=df_promoters['id'],
        format_func=lambda x: f"{df_promoters[df_promoters['id'] == x]['name'].iloc[0]} (ID: {x})",
        key="promoter_selector"
    )
    
    col1, col2 = st.columns(2)
    if col1.button("✏️ Editar Promotor Seleccionado"):
        selected_promoter_data = df_promoters[df_promoters['id'] == selected_id].iloc[0].to_dict()
        st.session_state.selected_promoter = selected_promoter_data
        st.rerun()
        
    if col2.button("🗑️ Eliminar Promotor Seleccionado"):
        try:
            supabase_client.from_("promoters").delete().eq("id", selected_id).execute()
            st.toast("Promotor eliminado.")
            st.cache_data.clear()
            st.rerun()
            st.cache_data.clear()
            st.rerun()
        except Exception as e:
            st.error(f"Error al eliminar: {e}. Asegúrate de que no esté asociado a ninguna propiedad.")
else:
    st.info("No hay promotores registrados.")
