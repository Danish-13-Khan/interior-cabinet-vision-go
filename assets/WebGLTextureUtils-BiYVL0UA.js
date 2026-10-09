import{aQ as g,e as u,bQ as p,c as w,M as S,P as h,S as T,W as b,bP as C}from"./three-core-CDr7e0BY.js";let l,c,i,o;function F(e,m=1/0,n=null){c||(c=new g(2,2,1,1)),i||(i=new u({uniforms:{blitTexture:new p(e)},vertexShader:`
			varying vec2 vUv;
			void main(){
				vUv = uv;
				gl_Position = vec4(position.xy * 1.0,0.,.999999);
			}`,fragmentShader:`
			uniform sampler2D blitTexture; 
			varying vec2 vUv;

			void main(){ 
				gl_FragColor = vec4(vUv.xy, 0, 1);
				
				#ifdef IS_SRGB
				gl_FragColor = sRGBTransferOETF( texture2D( blitTexture, vUv) );
				#else
				gl_FragColor = texture2D( blitTexture, vUv);
				#endif
			}`})),i.uniforms.blitTexture.value=e,i.defines.IS_SRGB=e.colorSpace==w,i.needsUpdate=!0,o||(o=new S(c,i),o.frustumCulled=!1);const f=new h,v=new T;v.add(o),n===null&&(n=l=new b({antialias:!1}));const s=Math.min(e.image.width,m),r=Math.min(e.image.height,m);n.setSize(s,r),n.clear(),n.render(v,f);const t=document.createElement("canvas"),d=t.getContext("2d");t.width=s,t.height=r,d.drawImage(n.domElement,0,0,s,r);const a=new C(t);return a.minFilter=e.minFilter,a.magFilter=e.magFilter,a.wrapS=e.wrapS,a.wrapT=e.wrapT,a.colorSpace=e.colorSpace,a.name=e.name,l&&(l.forceContextLoss(),l.dispose(),l=null),a}export{F as decompress};
