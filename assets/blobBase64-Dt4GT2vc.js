async function o(n){const e=await n.arrayBuffer(),t=new Uint8Array(e);let a="";for(let r=0;r<t.length;r++)a+=String.fromCharCode(t[r]);return btoa(a)}export{o as blobToBase64};
