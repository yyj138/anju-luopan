(() => {
    const { globalState } = window.Anju;
    const {
        HomePage,
        FindHousePage,
        AnalysisPage,
        AIChatPage,
        AboutPage,
        PersonalizedRecommendationPage,
        MainLayout
    } = window.Components;

    const routes = [
        { path: '/', component: HomePage },
        { path: '/findhouse', component: FindHousePage },
        { path: '/personalized-recommendation', component: PersonalizedRecommendationPage },
        { path: '/analysis', component: AnalysisPage },
        { path: '/ai-chat', component: AIChatPage },
        { path: '/about', component: AboutPage }
    ];

    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes
    });

    // 全局状态注入 + 挂载
    const app = Vue.createApp({
        provide() {
            return { globalState };
        },
        template: '<MainLayout />'
    });

    app.component('MainLayout', MainLayout);
    app.use(router);
    app.mount('#app');
})();

