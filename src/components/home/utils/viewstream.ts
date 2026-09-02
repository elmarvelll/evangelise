import api from "@/lib/axios"


export default async function viewstream(id:string){
    const request = await api.post('/livekit/viewer_token',{id})
    const response = request.data
    return response
}