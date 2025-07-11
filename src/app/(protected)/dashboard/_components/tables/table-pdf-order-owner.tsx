"use client";

import { formatToRupiah } from "@/lib/utils";
import { Order, PaketOrder, Store, TStatusOrder, User } from "@prisma/client";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    backgroundColor: "#eee",
    fontWeight: "bold",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    flex: 1,
  },

  headerCellNo: {
    flex: 0.3,
    textAlign: "center",
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    fontWeight: "bold",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#eee",
  },

  cell: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    flex: 1,
  },
  cellNo: {
    flex: 0.3,
    textAlign: "center",
    padding: 4,
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  footer: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 9,
    marginRight: 4,
  },
  summary: {
    marginTop: 12,
    fontSize: 11,
    textAlign: "right",
    fontWeight: "bold",
  },
});

const ITEMS_PER_PAGE = 20;

type OrderTablePDFDocumentProps = {
  data: Array<
    Order & { user: User; store: Store & { admin: User }; pakets: PaketOrder[] }
  >;
};

export default function TablePdfOrderOwner({
  data,
}: OrderTablePDFDocumentProps) {
  const pages = Array.from(
    { length: Math.ceil(data.length / ITEMS_PER_PAGE) },
    (_, i) => data.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE),
  );

  const totalSettle = data
    .filter((d) => d.status === TStatusOrder.SETTLEMENT)
    .reduce((acc, d) => acc + d.totalPrice, 0);

  const totalLain = data
    .filter((d) => d.status !== TStatusOrder.SETTLEMENT)
    .reduce((acc, d) => acc + d.totalPrice, 0);

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page size="A4" style={styles.page} key={pageIndex}>
          <Text
            style={{
              marginBottom: 8,
              fontSize: 14,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Laporan Order
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.headerCellNo}>NO</Text>
              <Text style={styles.headerCell}>Payment</Text>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Store</Text>
              <Text style={styles.headerCell}>Head Store</Text>
              <Text style={styles.headerCell}>Customer</Text>
              <Text style={styles.headerCell}>Status</Text>
              <Text style={styles.headerCell}>Total Price</Text>
            </View>
            {pageData.map((item, idx) => (
              <View style={styles.row} key={item.id}>
                <Text style={styles.cellNo}>
                  {pageIndex * ITEMS_PER_PAGE + idx + 1}
                </Text>
                <Text style={styles.cell}>{item.paymentMethod}</Text>
                <Text style={styles.cell}>
                  {new Date(item.createdAt).toLocaleDateString("id-ID")}
                </Text>
                <Text style={styles.cell}>{item.store.name}</Text>
                <Text style={styles.cell}>{item.store.admin.name}</Text>
                <Text style={styles.cell}>
                  {item.informationCustomer?.first_name || item.user.name}
                </Text>
                <Text style={styles.cell}>{item.status}</Text>
                <Text style={styles.cell}>
                  Rp {formatToRupiah(item.totalPrice)}
                </Text>
              </View>
            ))}
          </View>

          <Text
            fixed
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />

          {pageIndex === pages.length - 1 && (
            <View style={styles.summary}>
              <Text style={{ marginVertical: 5 }}>
                Total Pembayaran Berhasil: Rp {formatToRupiah(totalSettle)}
              </Text>
              <Text>
                Total Pembayaran Gagal: Rp {formatToRupiah(totalLain)}
              </Text>
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
}
