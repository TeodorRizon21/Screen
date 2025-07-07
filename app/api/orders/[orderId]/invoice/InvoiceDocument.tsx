import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
    alignItems: "center",
    height: 24,
  },
  description: {
    width: "60%",
  },
  quantity: {
    width: "10%",
  },
  price: {
    width: "15%",
    textAlign: "right",
  },
  amount: {
    width: "15%",
    textAlign: "right",
  },
  totalContainer: {
    marginTop: 20,
    textAlign: "right",
  },
  total: {
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
});

interface InvoiceDocumentProps {
  order: any;
}

export const InvoiceDocument = ({ order }: InvoiceDocumentProps) => {
  const formattedDate = format(new Date(), "dd.MM.yyyy");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={[styles.title, styles.bold]}>Factura</Text>
          <Text>Data: {formattedDate}</Text>
          <Text>Numar comanda: {order.orderNumber}</Text>
        </View>

        {order.details.isCompany && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date furnizor:</Text>
              <Text>ScreenShield SRL</Text>
              <Text>CUI: RO12345678</Text>
              <Text>Reg. Com.: J40/123/2023</Text>
              <Text>Adresa: Strada Exemplu, Nr. 123</Text>
              <Text>Oras, Judet, Cod Postal</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date cumparator:</Text>
              <Text>{order.details.companyName}</Text>
              <Text>CUI: {order.details.cui}</Text>
              <Text>Reg. Com.: {order.details.regCom}</Text>
              <Text>Adresa sediului social: {order.details.companyStreet}</Text>
              <Text>
                {order.details.companyCity}, {order.details.companyCounty}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date livrare:</Text>
              <Text>Adresa: {order.details.street}</Text>
              <Text>
                {order.details.city}, {order.details.county}{" "}
                {order.details.postalCode}
              </Text>
              <Text>{order.details.country}</Text>
            </View>
          </>
        )}

        {!order.details.isCompany && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date livrare:</Text>
            <Text>{order.details.fullName}</Text>
            <Text>{order.details.email}</Text>
            <Text>{order.details.phoneNumber}</Text>
            <Text>{order.details.street}</Text>
            <Text>
              {order.details.city}, {order.details.county}{" "}
              {order.details.postalCode}
            </Text>
            <Text>{order.details.country}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.description, styles.bold]}>Produs</Text>
            <Text style={[styles.quantity, styles.bold]}>Cant.</Text>
            <Text style={[styles.price, styles.bold]}>Pret</Text>
            <Text style={[styles.amount, styles.bold]}>Total</Text>
          </View>

          {order.items.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.description}>
                {item.product.name} ({item.size})
              </Text>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.price}>{item.price.toFixed(2)} RON</Text>
              <Text style={styles.amount}>
                {(item.price * item.quantity).toFixed(2)} RON
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <Text style={[styles.total, styles.bold]}>
            Total: {order.total.toFixed(2)} RON
          </Text>
        </View>
      </Page>
    </Document>
  );
};
