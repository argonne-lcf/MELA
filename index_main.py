from flask import Flask, g
from flask import render_template
import os
import flask_sijax
import json
from influxdb import InfluxDBClient
import numpy as np
import pandas as pd
import pandas as pd
from sklearn import decomposition, datasets
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from clusterW.clusterWCE import clusterWCE
from sklearn.preprocessing import StandardScaler
import datetime
import re
import matplotlib.pyplot as plt



path = os.path.join('.', os.path.dirname(__file__), 'static/js/sijax/')
app = Flask(__name__)

#below for flask-sijax
app.config['SIJAX_STATIC_PATH'] = path
app.config['SIJAX_JSON_URI'] = '/static/js/sijax/json2.js'
flask_sijax.Sijax(app)


dict_cnameIDSCnames = {}
with open('cname_id_name1.json') as f:
	dict_cnameIDSCnames = json.load(f)


data_cname_sedc = {}
with open('data_cname.json') as f:
    data_cname_sedc = json.load(f)



client = InfluxDBClient(host="localhost", port=8086)
client.get_list_database()
client.switch_database("sedc_test")

#get all sedc measurements
measurements = client.query("Show measurements").raw
series = measurements['series']
m_vals = np.array(series[0]['values']).flatten()
ori_response = {}
ori_response["mvals"] = m_vals
ori_response["cnames_all"] = dict_cnameIDSCnames.keys()


def get_TV(data,color):
    arr = np.array(data['series'][0]['values'])
    arr_vals = arr[:,-1]
    arr_vals = arr_vals.astype(float)
    arr_time = arr[:,0]
    arr_time_val = np.array(list(zip(arr_time,arr_vals)))
    ts = pd.Series(arr_vals, index=arr_time)
    ts.plot(logy=True, figsize=(50,30), color=color)
    return arr_time_val


def getArr(data, sedc_df):

    assert(len(data[u'series']) == 1)

    sedc_cols = ["timestamp", data[u'series'][0][u'name']]
    times = np.array(data[u'series'][0][u'values'])[:,0]
    times = np.array([re.split("\.\d{1,}Z", i)[0]+"Z" for i in times])
    vals = np.array(data[u'series'][0][u'values'])[:,-1]

    df_tmp = pd.DataFrame({"timestamp":times, data[u'series'][0][u'name']:vals }).set_index("timestamp")

    sedc_df = df_tmp if sedc_df.empty else pd.concat((sedc_df, df_tmp), axis=1)


    return np.array(data[u'series'][0][u'values'])[:,-1], sedc_df


def getDIMRed(X, selected_dimRed, y=None):
    X_r = None
    if "pca" in selected_dimRed.lower():
        pca = PCA(n_components=2, whiten=True)
        X_r = pca.fit(X).transform(X)
    elif "lda" in selected_dimRed.lower():
        lda = LinearDiscriminantAnalysis(n_components=2)
        X_r = lda.fit(X, y).transform(X)
    else:
        tsne = TSNE(n_components=2, perplexity=30)
        X_r = tsne.fit_transform(X)

    x_min, x_max = np.min(X_r, 0), np.max(X_r, 0)
    X1 = (X_r - x_min) / (x_max - x_min)

    return (X_r, X1.tolist())


def saveClusterImgs(X, gp):
	pd_times = pd.DataFrame(X,index= X.index)
	c1 = ['b', 'g', 'r', 'c', 'y', 'm']
	c = ["#1b70fc", "#faff16", "#d50527", "#158940", "#f898fd", "#24c9d7","#cb9b64", "#866888", "#22e67a", "#e509ae", "#9dabfa", "#437e8a",\
        "#b21bff", "#ff7b91", "#94aa05", "#ac5906", "#82a68d", "#fe6616","#7a7352", "#f9bc0f", "#b65d66", "#07a2e6", "#c091ae", "#8a91a7",\
        "#88fc07", "#ea42fe", "#9e8010", "#10b437", "#c281fe", "#f92b75","#07c99d", "#a946aa", "#bfd544", "#16977e", "#ff6ac8", "#a88178",\
        "#fe9169", "#cd714a", "#6ed014", "#c5639c", "#c23271", "#698ffc","#678275", "#c5a121", "#a978ba", "#ee534e", "#d24506", "#59c3fa",\
        "#ca7b0a", "#6f7385", "#9a634a", "#48aa6f", "#ad9ad0", "#d7908c","#6a8a53", "#8c46fc", "#8f5ab8", "#fd1105", "#7ea7cf", "#d77cd1",\
        "#a9804b", "#0688b4", "#6a9f3e", "#ee8fba", "#a67389", "#9e8cfe","#bd443c", "#6d63ff", "#d110d5", "#798cc3", "#df5f83", "#b1b853"]
	gm = [ c[i-1] for i in gp]

	pd_timesT = pd_times.T

	fig = plt.figure(figsize=(40,20))
	for i,v in enumerate(pd_times.columns):

	    lis = [np.log10(k) for k in pd_times[v].tolist() ]
	    plt.plot(list(range(len(lis))),lis,c='black')
	    plt.scatter(list(range(len(lis))),lis,s=50,marker="o", alpha = 1, c=gm)


	fig.savefig("test.jpg")




def getResp(sedcRes = None, selected_cname = None, selected_dimRed ="tsne", cname = None, ts = '2018-06-06T18:01:39Z'):

    dictN = {}

    #Environment Errors:
    cname_nonode = cname.split('n')[0]
    cname_node = cname.split('n')[1]

    ts1 = datetime.datetime.strptime(ts, '%Y-%m-%dT%H:%M:%SZ')
    ts1.strftime('%Y-%m-%dT%H:%M:%SZ')
    ts2 = ts1 - datetime.timedelta(minutes=180)
    ts4 = ts2.strftime('%Y-%m-%dT%H:%M:%SZ')
    ts3 = ts1 + datetime.timedelta(minutes=180)
    ts5 = ts3.strftime('%Y-%m-%dT%H:%M:%SZ')

    sedc_df = pd.DataFrame()

    for s in sedcRes:

        data_P = client.query('Select * from "'+s+'" where cname=\''+selected_cname+'\'  and time> \''+ts4+'\' and time < \''+ts5+'\' ORDER BY time desc limit 2000').raw

        if 'series' in data_P.keys():
            dictN[s],sedc_df = getArr(data_P, sedc_df)


    sedc_df.fillna(method='ffill', inplace=True)
    data = sedc_df[sedc_df.columns[2:]]
    data = data.astype('float64')
    names = data.columns

    correlations = data.corr()
    correlations = correlations.fillna(1)


    # correlation vals are modified below...
    ori_response["corr_vals"] = []
    cols = names
    for i in range(len(cols)):
        for j in range(len(cols)):
            dict_resp = {"column":j+1, "row":i+1, "column_x":cols[i], "column_y":cols[j], "correlation": correlations.values[i][j]}
            ori_response['corr_vals'].append(dict_resp);



    ori_response["corr_cols"] = correlations.columns.tolist()

    #lasso code PCA stuff here...

    sedc_nodeList = sedcRes

    sedc_final_arr= []
    sedc_final_arr_cols = []
    new_sedc_nodeList = []
    for i in sedc_nodeList:
        sedc_res = client.query('Select * from "'+i+'" where cname=\''+cname_nonode+'\' and time> \''+ts4+'\' and time < \''+ts5+'\' ORDER BY time asc limit 1000').raw

        if u'series' not in sedc_res.keys():
            continue
        new_sedc_nodeList.append(i)

        sedc_final_arr_cols.append([x for x in sedc_res[u'series'][0][u'columns']])
        sedc_res = np.array(sedc_res[u'series'][0][u'values'])
        sedc_final_arr.append(sedc_res)

    #PCA analysis with rows-> measurements, columns -> timestamps
    pd_pca = pd.DataFrame()

    for i,v in enumerate(new_sedc_nodeList):
        cols = sedc_final_arr_cols[new_sedc_nodeList.index(v)]
        cols[cols.index('value')] = v
        pd1 = pd.DataFrame(sedc_final_arr[new_sedc_nodeList.index(v)],columns=cols)
        pd1.time = pd.to_datetime(pd1.time)
        pd1.time = pd1.time.map(lambda s: s.replace(microsecond=0))
        pd1 = pd1.set_index("time")
        pdS1 = pd.to_numeric(pd1[v])
        pd_pca = pd.concat([pd_pca,pdS1], axis=1)

    pd_pca1 = pd_pca
    pd_pca2 = pd_pca1.fillna(method='pad', axis=0)
    pd_pca2 = pd_pca2.fillna(method='bfill', axis=0)
    pd_pca_T = pd_pca2.T

    dt_S_T = pd_pca_T
    cols = {j:'VAL_'+str(i) for i,j in zip(list(range(len(dt_S_T.columns))), dt_S_T.columns)}
    pd_final = dt_S_T.rename(columns=cols)
    t= ['BC_L_NODE3_CPU0_CPU_THROTTLE', 'BC_P_NODE3_CPU0_PCKG_ACC']
    pd_pca_T_final1 = pd_final.loc[~pd_final.index.isin(t)]
    y = pd_final.T.values
    x = range(y.shape[1])
    a = clusterWCE()

    gp = a.getClusters(x,y, 4)
    X=pd_final.T
    sc = StandardScaler()
    X_train_std = sc.fit_transform(X)
    n_c = 3

    y = None if "lda" not in selected_dimRed.lower() else gp.tolist()

    X_train_pca_transform, dim_res = getDIMRed(X_train_std, selected_dimRed, y)

    arr = np.array(X.values.tolist())
    arr[arr == 0] = 10**-2
    ori_response["X"] = arr.tolist()
    ori_response["timestamps"] = pd_pca_T.columns.tolist();
    ori_response["gp"] = gp.tolist();
    ori_response["pca_res"] = X_train_pca_transform.tolist()

    saveClusterImgs(X, gp)
    return ori_response


@flask_sijax.route(app, "/")
def hello():

    def getDR(obj_response, arg1, arg2, arg3, ts, cval, dimRed):

        res_getSedc = str(dict_cnameIDSCnames[str(cval)])


        ori_response = getResp(arg3, arg1, dimRed,res_getSedc, ts)
        obj_response.script('CorrPlt('+str(ori_response['corr_vals'])+','+str(ori_response['corr_cols']) \
            +','+str(ori_response['pca_res'])+','+str(ori_response["gp"])+','+str(cval)+')')

    def getSedc(obj_response, arg1):

        res_getSedc = str(dict_cnameIDSCnames[str(arg1)])
        res_getSedc1 = res_getSedc.split("n")[0]
        res_sedcList = data_cname_sedc[res_getSedc1]
        res_sedcList1 = sorted(res_sedcList)

        obj_response.script('sedcDropdown('+str(res_sedcList1)+', '+str([res_getSedc1])+', '+str([arg1])+')')


    def getAggs(obj_response, selectedPCs, cnameid):
        agg_response = {}
        agg_response["X"] = []
        agg_response["cols"] = []

        for i in selectedPCs:

            row = np.log10(ori_response["X"][int(i)]).tolist();
            agg_response["X"].append(row)
            ts = ori_response["timestamps"][int(i)]
            ts = ts.strftime("%Y-%m-%dT%H:%M:%SZ")
            agg_response["cols"].append(ts)

        ori_response["X1"] = np.log10(np.transpose(np.array(ori_response["X"]))).tolist()
        agg_response["X"] = np.transpose(np.array(agg_response["X"])).tolist()

        dx = np.min(ori_response["X1"])
        dy = np.max(ori_response["X1"])

        t1 = [np.min(ori_response["timestamps"]).strftime("%Y-%m-%dT%H:%M:%SZ"), \
        np.max(ori_response["timestamps"]).strftime("%Y-%m-%dT%H:%M:%SZ")]

        ori_timestamps =  [ ts.strftime("%Y-%m-%dT%H:%M:%SZ") for ts in ori_response["timestamps"]]

        obj_response.script('lineSedc('+str(ori_response["X1"])+','+str(agg_response["X"])+', '\
            +str(selectedPCs)+', '+str([dx])+', '+str([dy])+','+str(t1)+','+str(cnameid)+','+str(ori_timestamps)+','+str(agg_response["cols"])+')')

    def dimensional_reduction(obj_response,cval ,dim_red):
        X = ori_response["X"]
        sc = StandardScaler()
        X_train_std = sc.fit_transform(X)
        y = ori_response['gp'] if "lda" in dim_red.lower() else None
        X_train_pca_transform, dim_res = getDIMRed(X_train_std, dim_red, y)
        ori_response['pca_res'] = X_train_pca_transform.tolist()

        obj_response.script('CorrPlt('+str(ori_response['corr_vals'])+','+str(ori_response['corr_cols']) \
            +','+str(X_train_pca_transform.tolist())+','+str(ori_response["gp"])+','+str(cval)+')')



    if g.sijax.is_sijax_request:

        g.sijax.register_callback('getDR', getDR)

        g.sijax.register_callback('getSedc', getSedc)

        g.sijax.register_callback('getAggs', getAggs)

        g.sijax.register_callback('dimensional_reduction', dimensional_reduction)


        return g.sijax.process_request()

    return render_template("index_flask.html", ori_response = ori_response);
