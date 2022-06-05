<template>
	<el-image v-if="col.jsfun=='show_rectangle_image_field'" fit="cover" style="width: 100px; height: 50px"
		:src="row[col.field]" :preview-src-list="[row[col.field]]"></el-image>
	<el-image v-else-if="col.jsfun=='show_square_image_field'" fit="cover" style="width: 50px; height: 50px"
		:src="row[col.field]" :preview-src-list="[row[col.field]]"></el-image>
	<view v-else-if="col.jsfun=='copy_field'">
		<el-tooltip effect="dark" content="点击复制内容" placement="top">
		  <el-button type="text" @click="copy(row[col.field])">{{ row[col.field] }}</el-button>
		</el-tooltip>
	</view>
	<view class="" v-else-if="col.jsfun == 'show_figma_plugin_id'">
		<el-popover
		    placement="top-start"
		    :title="row.name"
		    width="600"
		    trigger="hover"
		    >
			<view v-html="row.description">
			</view>	
		<el-link slot="reference" type="primary" :href="'https://www.figma.com/community/plugin/'+row.plugin_id" target="_blank">{{ row[col.field] }}</el-link>
		</el-popover>
	</view>
	<view v-else class="">
		<el-tooltip effect="dark" :content="col.jsfun+'函数不存在'" placement="top">
		  <el-button type="text">{{ row[col.field] }}</el-button>
		</el-tooltip>
		</view>
</template>

<script>
	import {copy} from './smodel.js'
	export default {
		name: 'SpageJsfun',
		props: {},
		data() {
			return {
				loading: false,
			}
		},
		props: {
			col: {
				type: Object,
				default () {
					return {
						jsfun: '',
						field: ''
					}
				}
			},
			row: {
				type: Object,
				default () {
					return {}
				}
			}
		},
		watch: {},
		computed: {},
		methods: {
			copy(text){
				copy(text, ()=>{
					this.$message.success('复制成功')
				})
			}
		}
	};
</script>

<style lang="scss" scoped>
	@import 'smodel.scss';
</style>
