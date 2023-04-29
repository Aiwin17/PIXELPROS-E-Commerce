function addToCart(proId){
    $.ajax({
        url:'/add-to-cart?id='+proId,
        method:'get',
        success:(response)=>{
            console.log(response.cartCount);
            if(response.status){
                let count =$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
                $("#addToCart").empty()
                let addtocartData = ` <style>
                .main_menu .cart i:after {
                    content: "${response.cartCount}";
                  }
             </style>`
                $("#addToCart").append(addtocartData)    
            }
        }
    })
}