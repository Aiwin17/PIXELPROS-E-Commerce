let userSession = (req,res,next)=>{
    if( req.session.loggedIn){
        next()
    }else{
        res.redirect('/login')
    }
}
let loginSession = (req,res,next)=>{
    if(req.session.loggedIn){
        res.redirect('back')
    }else{
        next()
    }
}
module.exports= {userSession,loginSession}