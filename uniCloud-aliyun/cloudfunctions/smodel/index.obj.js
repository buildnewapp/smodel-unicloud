// 开发文档: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const db = uniCloud.database();

function error(errCode, errMsg) {
	return response(errCode, errMsg)
}

function success(data) {
	return response(0, 'ok', data)
}

function response(errCode, errMsg, data = {}) {
	return {
		errCode: errCode,
		errMsg: errMsg,
		data: data
	}
}
module.exports = {

	async getSmodelInfo(name) {
		let smodel = await db.collection('smodel').where({
			name: name
		}).get({
			getOne: true
		})
		if (smodel.affectedDocs == 1) smodel = smodel.data[0]
		let fields = await db.collection('sfield').where({
			smodel_id: smodel._id
		}).get()
		fields = fields.data
		// 模型字段预处理
		let fieldMap = {}
		for (let field of fields) {
			fieldMap[field.name] = field
		}
		return {
			smodel,
			fields,
			fieldMap
		}
	},
	async getSmodelList(name, type) {
		let where = {
			'status': 1
		}
		if (name) where['name'] = new RegExp(name)
		if (type) where['type'] = type
		let res = await db.collection('smodel').where(where).get()
		let count = await db.collection('smodel').where(where).count()

		return success({
			total: count.total,
			lists: res.data
		})
	},
	async copySmodel(spage, npage) {
		let smodel = await db.collection('smodel').where({
			name: spage
		}).get({
			getOne: true
		})
		smodel = smodel.data[0]
		let fields = await db.collection('sfield').where({
			smodel_id: smodel._id
		}).get()
		fields = fields.data

		smodel.name = npage
		delete smodel['_id']
		smodel['create_time'] = new Date()
		const transaction = await db.startTransaction()
		try {
			let res = await db.collection('smodel').add(smodel)
			console.log('res', res)
			let new_smodel_id = res.id
			for (let field of fields) {
				field['create_time'] = new Date()
				delete field['_id']
				field.smodel_id = new_smodel_id
				await db.collection('sfield').add(field)
			}
		} catch (e) {
			await transaction.rollback()
			console.error(`复制模型 error`, e)
			return error(1, e.message || '请求服务失败')
		}
		return success('模型复制成功')
	},
	async deleteSmodel(_id, spage, smodel_choose, sfield_choose, menu_choose, permission_choose) {
		const transaction = await db.startTransaction()
		try {
			if (smodel_choose == 1) {
				await db.collection('smodel').doc(_id).update({
					'status': -1
				})
			} else if (smodel_choose == 2) {
				await db.collection('smodel').doc(_id).remove()
			}
			if (sfield_choose == 1) {
				await db.collection('smodel').where({
					smodel_id: _id
				}).update({
					'status': -1
				})
			} else if (sfield_choose == 2) {
				await db.collection('sfield').where({
					smodel_id: _id
				}).remove()
			}
			if (menu_choose == 2) {
				await db.collection('opendb-admin-menus').where({
					'menu_id': new RegExp(spage + '-')
				}).remove()
			}
			if (permission_choose == 2) {
				await db.collection('uni-id-permissions').where({
					'permission_id': new RegExp(spage + '-')
				}).remove()
			}
			return success('删除模型成功')
		} catch (e) {
			await transaction.rollback()
			console.error(`删除模型 error`, e)
			return error(1, e.message || '请求服务失败')
		}
	},
	async importSmodel(jsonStr) {
		const transaction = await db.startTransaction()
		try {
			let schemaCode = JSON.parse(jsonStr)
			let smodel = schemaCode.smodel
			let fields = schemaCode.fields
			smodel['create_time'] = new Date()
			await db.collection('smodel').add(smodel)
			for (let field of fields) {
				field['create_time'] = new Date()
				await db.collection('sfield').add(field)
			}
			return success('导入模型成功')
		} catch (e) {
			await transaction.rollback()
			console.error(`transaction error`, e)
			return error(1, e.message || '请求服务失败')
		}
	},
	async getAdminMenus() {
		let res = await db.collection('opendb-admin-menus').orderBy('sort', 'desc').get()
		return success(res.data)
	},
	async getAdminPermissions() {
		let res = await db.collection('uni-id-permissions').orderBy('sort', 'asc').get()
		return success(res.data)
	},
	async addSmodelMenu(menus, permissions) {
		const transaction = await db.startTransaction()
		try {
			await db.collection('opendb-admin-menus').add(menus)
			await db.collection('uni-id-permissions').add(permissions)
			return success('添加菜单权限成功')
		} catch (e) {
			await transaction.rollback()
			console.error(`transaction error`, e)
			return error(1, e.message || '请求服务失败')
		}
	},
	async addSmodel(form) {
		let res = await db.collection('smodel').where({
			name: form.name
		}).count()
		console.log('result', res, form)
		let count = res.total
		if (count > 0) {
			return error(1, `添加模型${form.name}已存在`)
		}
		form = Object.assign({}, form, {
			status: 1,
			create_time: new Date(),
			collection: form.name,
			formType: 'base',
			formGroups: [{
				name: '基础',
				fields: []
			}],
			girdData: [],
			searchFields: [],
			searchFormFields: [],
			addBtn: true,
			editBtn: true,
			multBtn: false,
			delBtn: false,
			exportBtn: false,
			importBtn: false
		})
		return db.collection('smodel').add(form)
	},
	updateSmodel(id, data) {
		return db.collection('smodel').doc(id).update(data)
	}
}
