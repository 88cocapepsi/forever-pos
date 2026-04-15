// ====== APP.JSX FULL ĐÃ SỬA ======
import React,{useEffect,useMemo,useRef,useState} from "react";
import {ShoppingCart,LayoutGrid,BarChart3,Settings,LogOut,User,Lock,Plus,Trash2,Save,Receipt,Printer,Search,ShieldCheck,Coffee,Users,Bell,X} from "lucide-react";

const API=import.meta.env.VITE_API_URL?.trim()||"https://forever-pos.onrender.com";

const TABLES=["Bàn 1","Bàn 2","Bàn 3","Bàn 4","Bàn 5","Bàn 6","Bàn 7","Bàn 8","Bàn 9","Bàn 10","Mang về","Giao đi"];

const SHIFTS=[
{id:"morning",name:"Ca sáng"},
{id:"afternoon",name:"Ca chiều"},
{id:"evening",name:"Ca tối"}
];

const money=v=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(v||0);

// ===== PRINT BILL FIX =====
const printBill = (html) => {
  const win = window.open("", "", "width=300,height=600");

  win.document.write(`
    <html>
    <head>
      <style>
        body{
          font-family: monospace;
          width:58mm;
          padding:10px;
        }
        h2,h3,p{
          text-align:center;
          margin:4px 0;
        }
        .row{
          display:flex;
          justify-content:space-between;
        }
        hr{
          border-top:1px dashed #000;
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);

  win.document.close();
  win.print();
};
// ==========================

async function api(path,opt={}){
const token=localStorage.getItem("forever_token");
const res=await fetch(`${API}${path}`,{
...opt,
headers:{
"Content-Type":"application/json",
...(token?{Authorization:`Bearer ${token}`}:{})
}
});
return res.json();
}

export default function App(){

const [user,setUser]=useState(null);
const [menu,setMenu]=useState([]);
const [orders,setOrders]=useState({});
const [selectedTable,setSelectedTable]=useState("Bàn 1");

const order=orders[selectedTable]||{items:[]};

const totalPrice=(order.items||[]).reduce((s,i)=>s+i.qty*i.price,0);

// ===== CHECKOUT FIX =====
const checkout=async()=>{
if(!order.items.length) return alert("Chưa có món");

await api("/api/checkout",{
method:"POST",
body:JSON.stringify({
table:selectedTable,
items:order.items
})
});

// tạo HTML bill
const billHTML = `
  <h2>FOREVER Coffee & Beer</h2>
  <p>B38 Đường 4A, Q7</p>
  <hr/>
  ${order.items.map(i=>`
    <div class="row">
      <span>${i.name} x${i.qty}</span>
      <span>${money(i.qty*i.price)}</span>
    </div>
  `).join("")}
  <hr/>
  <h3>Tổng: ${money(totalPrice)}</h3>
  <p>${new Date().toLocaleString("vi-VN")}</p>
`;

printBill(billHTML);
};
// =======================

const addItem=(item)=>{
const exist=order.items.find(i=>i.id===item.id);
const next=exist
?order.items.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i)
:[...order.items,{...item,qty:1}];

setOrders(prev=>({...prev,[selectedTable]:{items:next}}));
};

return(
<div style={{padding:20}}>
<h2>FOREVER POS</h2>

<select value={selectedTable} onChange={e=>setSelectedTable(e.target.value)}>
{TABLES.map(t=><option key={t}>{t}</option>)}
</select>

<hr/>

<h3>Menu</h3>
<div>
{menu.map(item=>(
<button key={item.id} onClick={()=>addItem(item)}>
{item.name} - {money(item.price)}
</button>
))}
</div>

<hr/>

<h3>Đơn hiện tại</h3>
{order.items.map(i=>(
<div key={i.id}>
{i.name} x{i.qty} = {money(i.qty*i.price)}
</div>
))}

<h2>Tổng: {money(totalPrice)}</h2>

<button onClick={checkout}>Thanh toán & In bill</button>

</div>
);
}
