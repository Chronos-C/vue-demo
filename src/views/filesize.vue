<template>
    <div>
    </div>
</template>

<script>
import axios from 'axios'
export default {
    mounted(){
        axios.get('http://10.10.2.147:8199/api/v2/preview?web=vanceai&guest_token_v2=ecdc55fd6f69d26222b5f113162c4ac3&trans_id=a46508c1117d57539f529ac54e518d12',{
            headers: {'Content-Type': 'application/octet-stream'}
        }).then(res => {
            console.log(res)
             const blob = new Blob([res.data], {
            type: 'text/plain;charset=utf-8',
          })
            const path = window.URL.createObjectURL(blob)
            console.log(path,blob.size)
            const file = new window.File(
                [blob],'aaa.png')
                console.log(file)
        })
    }
}
</script>

<style>

</style>